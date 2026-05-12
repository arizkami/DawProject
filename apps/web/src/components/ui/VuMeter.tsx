const SEGMENTS = 16;

type Props = { level?: number; height?: number; width?: number };

export function VuMeter({ level = 0, height = 64, width = 5 }: Props) {
  const active = Math.round(level * SEGMENTS);
  return (
    <div className="flex flex-col-reverse gap-px" style={{ width, height }}>
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const on = i < active;
        const color = i >= SEGMENTS - 2 ? "#f07a72" : i >= SEGMENTS - 5 ? "#f0c35b" : "#7ccf86";
        return <div key={i} className="flex-1 rounded-[2px]" style={{ background: on ? color : "#343c45" }} />;
      })}
    </div>
  );
}
