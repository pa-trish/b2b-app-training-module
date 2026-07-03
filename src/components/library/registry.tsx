"use client";

import type { ComponentSpec, ComponentType } from "@/lib/types";
import { HeroIntro } from "./HeroIntro";
import { KeyPointsList } from "./KeyPointsList";
import { ConceptCard } from "./ConceptCard";
import { StepSequence } from "./StepSequence";
import { ScenarioBlock } from "./ScenarioBlock";
import { Callout } from "./Callout";
import { CheckpointQuiz } from "./CheckpointQuiz";
import { ReflectionPrompt } from "./ReflectionPrompt";
import { DocumentExcerpt } from "./DocumentExcerpt";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RegistryEntry = React.FC<{ content: any }>;

const COMPONENT_REGISTRY: Record<ComponentType, RegistryEntry> = {
  HeroIntro,
  KeyPointsList,
  ConceptCard,
  StepSequence,
  ScenarioBlock,
  Callout,
  CheckpointQuiz,
  ReflectionPrompt,
  DocumentExcerpt,
};

export function SectionRenderer({ spec }: { spec: ComponentSpec }) {
  const Component = COMPONENT_REGISTRY[spec.componentType];
  if (!Component) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        Unknown component: {spec.componentType}
      </div>
    );
  }
  return <Component content={spec.content} />;
}

export { COMPONENT_REGISTRY };
