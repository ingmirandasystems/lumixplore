import "./AnimatedBackground.css";

export type BackgroundColors = readonly [
  string,
  string,
  string,
  string,
  string,
];

interface AnimatedBackgroundProps {
  colors: BackgroundColors;
}

export function AnimatedBackground({ colors }: AnimatedBackgroundProps) {
  return (
    <div className="animated-background" aria-hidden="true">
      {colors.map((color, index) => (
        <span
          key={index}
          className={`animated-background__orb animated-background__orb--${index + 1}`}
          style={{ color }}
        />
      ))}
    </div>
  );
}
