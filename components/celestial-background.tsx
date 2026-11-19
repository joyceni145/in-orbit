type CelestialBackgroundProps = {
  fullField?: boolean;
};

export function CelestialBackground({ fullField = false }: CelestialBackgroundProps) {
  return (
    <div className={`sky${fullField ? " sky-full" : ""}`} aria-hidden="true">
      <div className="stars stars-far" />
      <div className="stars stars-near" />
      <div className="stars stars-glow" />
      <svg className="sky-constellation sky-constellation-left" viewBox="0 0 220 150">
        <path d="M18 102 58 48 104 70 142 24 198 58 168 122 104 70 62 126 18 102" />
        <g><circle cx="18" cy="102" r="2"/><circle cx="58" cy="48" r="2.5"/><circle cx="104" cy="70" r="3"/><circle cx="142" cy="24" r="2"/><circle cx="198" cy="58" r="2.5"/><circle cx="168" cy="122" r="2"/><circle cx="62" cy="126" r="2"/></g>
      </svg>
      <svg className="sky-constellation sky-constellation-right" viewBox="0 0 180 120">
        <path d="M14 76 48 22 92 48 138 18 166 72 116 104 92 48 52 98 14 76" />
        <g><circle cx="14" cy="76" r="2"/><circle cx="48" cy="22" r="2"/><circle cx="92" cy="48" r="2.8"/><circle cx="138" cy="18" r="2"/><circle cx="166" cy="72" r="2"/><circle cx="116" cy="104" r="2"/><circle cx="52" cy="98" r="2"/></g>
      </svg>
      <div className="shooting-star shooting-star-one" />
      <div className="shooting-star shooting-star-two" />
      <div className="shooting-star shooting-star-three" />
      <div className="shooting-star shooting-star-four" />
    </div>
  );
}
