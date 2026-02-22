import confetti from 'canvas-confetti';

export function fireConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#f59e0b', '#22d3ee', '#34d399', '#f472b6', '#a78bfa'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#f59e0b', '#22d3ee', '#34d399', '#f472b6', '#a78bfa'],
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}
