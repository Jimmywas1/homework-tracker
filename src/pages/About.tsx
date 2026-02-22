import { useEffect, useState } from 'react';

const affirmations = [
  "You're not just smart — you're 'forgot-to-study-but-still-aced-it' smart. But maybe study anyway. 😎",
  "Hey champ, remember: even LeBron had to practice free throws. You're doing great, kiddo.",
  "You are literally the coolest person I know. And yes, I know at least 4 other people.",
  "Fun fact: scientists confirm you're 100% capable of amazing things. Source: your dad.",
  "You miss 100% of the shots you don't take. — Wayne Gretzky — Michael Scott — Your Dad",
  "Somewhere out there, a future version of you is grateful you kept going today. Also, he's taller.",
  "You're like a fine cheese — you only get better with time. And yes, I just compared you to cheese.",
  "Remember: diamonds are just rocks that handled pressure really well. You got this, rock star. 💎",
  "I believe in you more than I believe pizza is the perfect food. And that's saying A LOT.",
  "Plot twist: the main character was YOU the whole time. Now go crush it.",
  "You're braver than you think, stronger than you seem, and loved more than you'll ever know. — Dad (not Winnie the Pooh)",
  "Today's forecast: 100% chance of you being awesome with scattered moments of greatness.",
  "If life gives you lemons, make lemonade. If life gives you homework, well… that's why I built this app.",
  "You're not just raising the bar — you ARE the bar. A granola bar. Full of energy and goodness. 🥇",
  "Pro tip from your old man: be yourself, because everyone else is already taken. Also, clean your room.",
  "You are the WiFi signal in a world of dead zones. Strong, reliable, and everyone wants to connect with you.",
  "Hey buddy, just a reminder: even Google doesn't have all the answers, but YOU have more than you think.",
  "You're like a software update — every day you're getting better, even if nobody notices right away.",
  "Roses are red, violets are blue, I'm not great at poems, but I'm proud of you. 🌹",
  "Your potential is like my dad jokes — absolutely unlimited and impossible to contain.",
];

export default function About() {
  const [affirmation, setAffirmation] = useState('');

  useEffect(() => {
    // Pick one based on the day so it changes daily but stays consistent within the day
    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    setAffirmation(affirmations[dayIndex % affirmations.length]);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] px-6">
      <div className="max-w-lg text-center space-y-8">
        <p className="text-4xl">💪</p>
        <p className="font-body text-xl md:text-2xl text-foreground/80 leading-relaxed italic">
          "{affirmation}"
        </p>
        <p className="text-xs text-muted-foreground/60 font-body pt-12">
          created with love by JLarge
        </p>
      </div>
    </div>
  );
}
