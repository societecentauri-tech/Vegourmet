import type { Step } from "@/lib/types";

interface StepListProps {
  steps: Step[];
}

/** Étapes de préparation numérotées d'une recette. */
export function StepList({ steps }: StepListProps) {
  return (
    <section aria-labelledby="steps-title">
      <h2 id="steps-title" className="font-heading text-2xl font-bold">
        Préparation
      </h2>
      <ol className="mt-4 flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-veg-green font-heading text-sm font-bold text-white"
            >
              {index + 1}
            </span>
            <p className="pt-1 leading-relaxed text-veg-ink">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
