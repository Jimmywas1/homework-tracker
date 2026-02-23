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
  lock_at: string | null;
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
  enrollments?: Array<{
    type: string;
    computed_current_score?: number;
    computed_current_grade?: string;
  }>;
  grading_periods?: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
  }>;
}

interface CanvasUser {
  id: number;
  name: string;
}

function cleanSubjectName(courseName: string): string {
  return courseName
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
}

/** Pick the active grading period from a list, or the closest one if none is current. */
function resolveActiveGP(gpList: any[]): any | null {
  if (!gpList || gpList.length === 0) return null;
  const now = Date.now();
  let gp = gpList.find((g: any) => now >= new Date(g.start_date).getTime() && now <= new Date(g.end_date).getTime());
  if (!gp) {
    gp = [...gpList].sort((a: any, b: any) => {
      const dA = Math.min(Math.abs(now - new Date(a.start_date).getTime()), Math.abs(now - new Date(a.end_date).getTime()));
      const dB = Math.min(Math.abs(now - new Date(b.start_date).getTime()), Math.abs(now - new Date(b.end_date).getTime()));
      return dA - dB;
    })[0];
  }
  return gp ?? null;
}

/** Parse grades out of a Canvas enrollment object. */
function parseGrades(e: any): { score: number | null; final: number | null; grade: string | null } {
  return {
    score: e?.grades?.override_score ?? e?.grades?.current_score ?? e?.computed_current_score ?? null,
    final: e?.grades?.final_score ?? e?.computed_final_score ?? null,
    grade: e?.grades?.override_grade ?? e?.grades?.current_grade ?? e?.computed_current_grade ?? null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CANVAS_API_TOKEN = Deno.env.get("CANVAS_API_TOKEN");
    if (!CANVAS_API_TOKEN) throw new Error("CANVAS_API_TOKEN is not configured");

    let CANVAS_BASE_URL = Deno.env.get("CANVAS_BASE_URL");
    if (!CANVAS_BASE_URL) throw new Error("CANVAS_BASE_URL is not configured");
    CANVAS_BASE_URL = CANVAS_BASE_URL.replace(/\/+$/, "");

    const headers = {
      Authorization: `Bearer ${CANVAS_API_TOKEN}`,
      Accept: "application/json",
    };

    // Fetch observees in parallel with nothing else — just one call now (self fetch removed, it was only a console log)
    let observees: CanvasUser[] = [];
    try {
      const observeesRes = await fetch(`${CANVAS_BASE_URL}/api/v1/users/self/observees?per_page=10`, { headers });
      if (observeesRes.ok) {
        observees = await observeesRes.json();
        if (observees.length > 0) console.log(`Observer account. Found ${observees.length} observees.`);
      } else {
        await observeesRes.text(); // drain
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

    const allCourseGrades: Array<{
      courseId: number;
      subject: string;
      currentScore: number | null;
      finalScore: number | null;
      currentGrade: string | null;
      studentName?: string;
    }> = [];

    const usersToFetch = observees.length > 0 ? observees : [{ id: null, name: "Student" }];

    // ── Process ALL students in PARALLEL (was sequential — big win for Benji+Levi) ──
    await Promise.all(usersToFetch.map(async (user) => {
      const studentId = user.id;
      const studentName = user.name;
      const firstName = studentName === "Student" ? undefined : studentName.split(" ")[0];

      console.log(`Fetching courses for: ${studentName}`);

      // Fetch courses — grading_periods embedded so we DON'T need a separate GP fetch below
      const coursesUrl = studentId
        ? `${CANVAS_BASE_URL}/api/v1/users/${studentId}/courses?enrollment_state=active&per_page=50&include[]=total_scores&include[]=grading_periods`
        : `${CANVAS_BASE_URL}/api/v1/courses?enrollment_state=active&per_page=50&include[]=total_scores&include[]=grading_periods`;

      const coursesRes = await fetch(coursesUrl, { headers });
      if (!coursesRes.ok) {
        console.error(`Canvas courses error for ${studentName}:`, coursesRes.status, await coursesRes.text());
        return;
      }
      const courses: CanvasCourse[] = await coursesRes.json();
      console.log(`Found ${courses.length} courses for ${studentName}`);

      // ── Resolve active quarter for assignment date filtering ──
      // Use grading periods already embedded in the first course — NO extra fetch needed.
      let activeQuarterStart: Date | null = null;
      let activeQuarterEnd: Date | null = null;
      const embeddedGP = resolveActiveGP(courses[0]?.grading_periods ?? []);
      if (embeddedGP) {
        activeQuarterStart = new Date(embeddedGP.start_date);
        activeQuarterEnd = new Date(embeddedGP.end_date);
        console.log(`Active quarter for ${studentName}: ${embeddedGP.title}`);
      }

      // ── Fetch enrollment grades ──
      const courseGradeMap = new Map<number, { currentScore: number | null; finalScore: number | null; currentGrade: string | null }>();

      if (studentId) {
        // Strategy 1: Bulk user-level fetch — one call gets all course grades at once.
        try {
          const bulkRes = await fetch(
            `${CANVAS_BASE_URL}/api/v1/users/${studentId}/enrollments?include[]=current_grades&state[]=active&per_page=100`,
            { headers }
          );
          if (bulkRes.ok) {
            const enrollments: any[] = await bulkRes.json();
            for (const e of enrollments) {
              const { score, final, grade } = parseGrades(e);
              if (score !== null || grade !== null) {
                courseGradeMap.set(e.course_id, { currentScore: score, finalScore: final, currentGrade: grade });
              }
            }
            console.log(`Bulk grades: ${courseGradeMap.size} courses for ${studentName}`);
          }
        } catch (err) {
          console.error(`Bulk enrollment error for ${studentName}:`, err);
        }

        // Strategy 2: Per-course fallback ONLY for courses still missing after bulk.
        // This handles the case where the bulk call lacks quarter-specific breakdown.
        const missingCourses = courses.filter(c => !courseGradeMap.has(c.id));
        if (missingCourses.length > 0) {
          await Promise.all(missingCourses.map(async (course) => {
            try {
              // Resolve a quarter-specific GP for this course (already embedded in courses fetch)
              const gpList: any[] = course.grading_periods ?? [];
              const targetGP = resolveActiveGP(gpList);
              const gpParam = targetGP ? `&grading_period_id=${targetGP.id}` : "";

              const enrollRes = await fetch(
                `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/enrollments?user_id=${studentId}&include[]=current_grades${gpParam}&per_page=5`,
                { headers }
              );
              if (!enrollRes.ok) return;

              const enrollments: any[] = await enrollRes.json();
              const e = enrollments[0];
              if (!e) return;

              let { score, final, grade } = parseGrades(e);

              // GP returned all-zero: fall back to YTD grade
              if (gpParam && score === 0 && final === 0 && !grade) {
                const ytdRes = await fetch(
                  `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/enrollments?user_id=${studentId}&include[]=current_grades&per_page=5`,
                  { headers }
                );
                if (ytdRes.ok) {
                  const ytdE = (await ytdRes.json())[0];
                  const ytd = parseGrades(ytdE);
                  if (ytd.score !== null && ytd.score > 0) {
                    score = ytd.score;
                    final = ytd.final;
                    console.log(`GP=0 fallback "${cleanSubjectName(course.name)}" (${studentName}): YTD=${score}%`);
                  }
                }
              }

              if (score !== null || grade !== null) {
                courseGradeMap.set(course.id, { currentScore: score, finalScore: final, currentGrade: grade });
                console.log(`Per-course grade "${cleanSubjectName(course.name)}" (${studentName}): ${score}%`);
              }
            } catch (err) {
              console.error(`Per-course grade error for ${course.id}:`, err);
            }
          }));
        }
      } else {
        // Self (student) account: grades are already embedded via total_scores
        for (const course of courses) {
          const enrollments: any[] = (course as any).enrollments ?? [];
          const e = enrollments.find((e: any) => ["observer", "student", "StudentEnrollment"].includes(e.type));
          if (e) {
            const { score, final, grade } = parseGrades(e);
            if (score !== null || grade !== null) {
              courseGradeMap.set(course.id, { currentScore: score, finalScore: final, currentGrade: grade });
            }
          }
        }
      }

      console.log(`Grades: ${courseGradeMap.size}/${courses.length} courses (${studentName})`);

      // Populate allCourseGrades
      for (const course of courses) {
        const grades = courseGradeMap.get(course.id);
        allCourseGrades.push({
          courseId: course.id,
          subject: cleanSubjectName(course.name),
          currentScore: grades?.currentScore ?? null,
          finalScore: grades?.finalScore ?? null,
          currentGrade: grades?.currentGrade ?? null,
          studentName: firstName,
        });
      }

      // ── Fetch assignments for all courses in parallel ──
      const now = new Date(); // computed once — not inside the assignment loop
      await Promise.all(courses.map(async (course) => {
        try {
          let assignRes = await fetch(
            `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/assignments?per_page=100&include[]=submission&order_by=due_at`,
            { headers }
          );
          if (!assignRes.ok) {
            console.error(`Assignments error for "${course.name}":`, assignRes.status, await assignRes.text());
            return;
          }

          let assignments: CanvasAssignment[] = await assignRes.json();

          // Fallback: if observer got 0 assignments, try without submission include,
          // then try the student submissions endpoint.
          if (assignments.length === 0 && studentId) {
            assignRes = await fetch(
              `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/assignments?per_page=100&order_by=due_at`,
              { headers }
            );
            if (assignRes.ok) assignments = await assignRes.json();

            if (assignments.length === 0) {
              const subRes = await fetch(
                `${CANVAS_BASE_URL}/api/v1/courses/${course.id}/students/submissions?student_ids[]=${studentId}&per_page=100&include[]=assignment`,
                { headers }
              );
              if (subRes.ok) {
                const submissions = await subRes.json();
                for (const sub of submissions) {
                  if (sub.assignment) {
                    assignments.push({
                      id: sub.assignment.id,
                      name: sub.assignment.name,
                      due_at: sub.assignment.due_at,
                      lock_at: sub.assignment.lock_at ?? null,
                      course_id: course.id,
                      has_submitted_submissions: sub.workflow_state !== "unsubmitted",
                      points_possible: sub.assignment.points_possible ?? null,
                      submission: { workflow_state: sub.workflow_state, grade: sub.grade, score: sub.score },
                    });
                  }
                }
              }
            }
          }

          console.log(`Course "${cleanSubjectName(course.name)}" (${studentName}): ${assignments.length} assignments`);

          for (const a of assignments) {
            const effectiveDueAt = a.lock_at || a.due_at;
            if (!effectiveDueAt) continue;

            // Skip Gimkit assignments from Chinese class
            if (course.name.toLowerCase().includes("chinese") && a.name.toLowerCase().includes("gimkit")) continue;

            // Quarter filtering
            if (activeQuarterStart && activeQuarterEnd) {
              const checkDate = new Date(a.due_at || effectiveDueAt);
              const graceStart = new Date(activeQuarterStart.getTime() - 10 * 24 * 60 * 60 * 1000);
              const graceEnd = new Date(activeQuarterEnd.getTime() + 10 * 24 * 60 * 60 * 1000);
              if (checkDate < graceStart || checkDate > graceEnd) continue;
            } else {
              // No quarter resolved: drop anything older than 90 days
              const daysPast = (now.getTime() - new Date(effectiveDueAt).getTime()) / (1000 * 60 * 60 * 24);
              if (daysPast > 90) continue;
            }

            const dueDate = new Date(effectiveDueAt);
            const dueDateStr = dueDate.toISOString().split("T")[0];
            const dueStatus: "overdue" | "upcoming" = dueDate < now ? "overdue" : "upcoming";

            let status: "todo" | "progress" | "done" = "todo";
            let grade: string | undefined;
            let score: number | undefined;
            const totalPoints = a.points_possible != null ? a.points_possible : undefined;

            if (a.submission) {
              const ws = a.submission.workflow_state;
              if (ws === "graded") {
                status = "done";
                grade = a.submission.grade || undefined;
                if (a.submission.score != null) score = a.submission.score;
              } else if (ws === "submitted" || ws === "pending_review") {
                status = "progress";
              } else if (a.has_submitted_submissions) {
                status = "progress";
              }
            }

            allAssignments.push({
              canvasId: a.id,
              title: a.name,
              subject: cleanSubjectName(course.name),
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
      }));
    }));

    console.log(`Total assignments collected: ${allAssignments.length}`);

    return new Response(
      JSON.stringify({ assignments: allAssignments, courseGrades: allCourseGrades }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("canvas-sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
