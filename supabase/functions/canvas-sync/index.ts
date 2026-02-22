import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CanvasAssignment {
  id: number;
  name: string;
  due_at: string | null;
  course_id: number;
  has_submitted_submissions: boolean;
  points_possible: number | null;
  submission?: {
    workflow_state: string;
    grade: string | null;
    score: number | null;
  };
}

interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
}

interface CanvasUser {
  id: number;
  name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CANVAS_API_TOKEN = Deno.env.get("CANVAS_API_TOKEN");
    if (!CANVAS_API_TOKEN) {
      throw new Error("CANVAS_API_TOKEN is not configured");
    }

    let CANVAS_BASE_URL = Deno.env.get("CANVAS_BASE_URL");
    if (!CANVAS_BASE_URL) {
      throw new Error("CANVAS_BASE_URL is not configured");
    }

    CANVAS_BASE_URL = CANVAS_BASE_URL.replace(/\/+$/, "");

    const headers = {
      Authorization: `Bearer ${CANVAS_API_TOKEN}`,
      Accept: "application/json",
    };

    // Check if this is an observer account by looking for observees
    let observees: CanvasUser[] = [];
    try {
      const selfRes = await fetch(`${CANVAS_BASE_URL}/api/v1/users/self`, { headers });
      if (selfRes.ok) {
        const self = await selfRes.json();
        console.log("Authenticated as:", self.name, `(id: ${self.id})`);
      } else {
        await selfRes.text();
      }

      const observeesRes = await fetch(
        `${CANVAS_BASE_URL}/api/v1/users/self/observees?per_page=10`,
        { headers }
      );
      if (observeesRes.ok) {
        observees = await observeesRes.json();
        if (observees.length > 0) {
          console.log(`Observer account detected. Found ${observees.length} observees.`);
        }
      } else {
        // Not an observer or endpoint not available — that's fine
        await observeesRes.text();
      }
    } catch (err) {
      console.log("Observee check skipped:", err);
    }

    const allAssignments: Array<{
      canvasId: number;
      title: string;
      subject: string;
      dueDate: string;
      status: "todo" | "progress" | "done";
      grade?: string;
      score?: number;
      totalPoints?: number;
      dueStatus: "overdue" | "upcoming" | "undated";
      canvasUrl: string;
      studentName?: string;
    }> = [];

    // If we have observees, iter over them. Otherwise, run once as the primary user.
    const usersToFetch = observees.length > 0 ? observees : [{ id: null, name: "Student" }];

    for (const user of usersToFetch) {
      const studentId = user.id;
      const studentName = user.name;
      
      console.log(`Fetching courses for student: ${studentName}`);

      // Fetch active courses
      const coursesUrl = studentId
        ? `${CANVAS_BASE_URL}/api/v1/users/${studentId}/courses?enrollment_state=active&per_page=50&include[]=total_scores`
        : `${CANVAS_BASE_URL}/api/v1/courses?enrollment_state=active&per_page=50`;

      const coursesRes = await fetch(coursesUrl, { headers });

      if (!coursesRes.ok) {
        const text = await coursesRes.text();
        console.error(`Canvas courses error for ${studentName}:`, coursesRes.status, text);
        continue; // Skip to next user
      }

      const courses: CanvasCourse[] = await coursesRes.json();
      console.log(`Found ${courses.length} courses for ${studentName}`);

      await Promise.all(
        courses.map(async (course) => {
          try {
            // Try fetching assignments 
            let assignUrl = `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/assignments?per_page=100&include[]=submission&order_by=due_at`;

            let assignRes = await fetch(assignUrl, { headers });

            if (!assignRes.ok) {
              const text = await assignRes.text();
              console.error(`Assignments error for "${course.name}" (${course.id}):`, assignRes.status, text);
              return;
            }

            let assignments: CanvasAssignment[] = await assignRes.json();

            // If observer got 0 assignments, try fetching without submission include
            // and get submissions separately
            if (assignments.length === 0 && studentId) {
              console.log(`Retrying "${course.name}" for ${studentName} without submission include...`);
              assignUrl = `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/assignments?per_page=100&order_by=due_at`;
              assignRes = await fetch(assignUrl, { headers });

              if (assignRes.ok) {
                assignments = await assignRes.json();
                console.log(`  Retry got ${assignments.length} assignments`);
              } else {
                await assignRes.text();
              }

              // If still empty, try the student's submissions endpoint directly
              if (assignments.length === 0) {
                console.log(`Trying submissions endpoint for student ${studentId} in course ${course.id}...`);
                const subUrl = `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/students/submissions?student_ids[]=${studentId}&per_page=100&include[]=assignment`;
                const subRes = await fetch(subUrl, { headers });

                if (subRes.ok) {
                  const submissions = await subRes.json();
                  console.log(`  Submissions endpoint returned ${submissions.length} items`);
                  
                  // Convert submissions to assignment format
                  for (const sub of submissions) {
                    if (sub.assignment) {
                      assignments.push({
                        id: sub.assignment.id,
                        name: sub.assignment.name,
                        due_at: sub.assignment.due_at,
                        course_id: course.id,
                        has_submitted_submissions: sub.workflow_state !== "unsubmitted",
                        points_possible: sub.assignment.points_possible ?? null,
                        submission: {
                          workflow_state: sub.workflow_state,
                          grade: sub.grade,
                          score: sub.score,
                        },
                      });
                    }
                  }
                } else {
                  const text = await subRes.text();
                  console.log(`  Submissions endpoint failed:`, subRes.status, text);
                }
              }
            }

            console.log(`Course "${course.name}" (${studentName}): ${assignments.length} assignments`);

            for (const a of assignments) {
              const now = new Date();
              let dueDateStr = "";
              let dueStatus: "overdue" | "upcoming" | "undated" = "undated";

              if (a.due_at) {
                const dueDate = new Date(a.due_at);
                const daysPast = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysPast > 90) continue;

                dueDateStr = dueDate.toISOString().split("T")[0];
                dueStatus = dueDate < now ? "overdue" : "upcoming";
              }

              let status: "todo" | "progress" | "done" = "todo";
              let grade: string | undefined;
              let score: number | undefined;
              let totalPoints: number | undefined;

              if (a.points_possible != null) {
                totalPoints = a.points_possible;
              }

              if (a.submission) {
                const ws = a.submission.workflow_state;
                if (ws === "graded") {
                  status = "done";
                  grade = a.submission.grade || undefined;
                  if (a.submission.score != null) score = a.submission.score;
                } else if (ws === "submitted" || ws === "pending_review") {
                  status = "done";
                } else if (a.has_submitted_submissions) {
                  status = "done";
                }
              }

              const subject = course.name
                .replace(/\s*H\*\s*/g, " ")
                .replace(/\s*\(.*?\)\s*/g, "")
                .replace(/\s*-\s*\d{4}-\d{2,4}\s*/g, "")
                .replace(/\s*-\s*[A-Z][a-z]+(\s|$).*$/g, "")
                .replace(/^S\d+\s+/i, "")
                .replace(/Honors/gi, "Hon.")
                .replace(/Language Arts/gi, "Lang Arts")
                .replace(/Physical Science/gi, "Phys Sci")
                .replace(/Civics\/Economics/gi, "Civics/Econ")
                .replace(/Technological/gi, "Tech")
                .replace(/\s+/g, " ")
                .trim();

              const firstName = studentName === "Student" ? undefined : studentName.split(' ')[0];

              allAssignments.push({
                canvasId: a.id,
                title: a.name,
                subject,
                dueDate: dueDateStr,
                status,
                grade,
                score,
                totalPoints,
                dueStatus,
                canvasUrl: `${CANVAS_BASE_URL}/courses/${course.id}/assignments/${a.id}`,
                studentName: firstName,
              });
            }
          } catch (err) {
            console.error(`Error fetching assignments for course ${course.id}:`, err);
          }
        })
      );
    }

    console.log(`Total assignments collected: ${allAssignments.length}`);

    return new Response(
      JSON.stringify({ assignments: allAssignments }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("canvas-sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
