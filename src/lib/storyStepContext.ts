export type StoryStepMeta = {
  id: string;
  label: string;
  title: string;
  summary: string;
};

let activeStorySteps: StoryStepMeta[] = [];

export function setStorySteps(steps: StoryStepMeta[] = []) {
  activeStorySteps = steps;
}

export function getStorySteps() {
  return activeStorySteps;
}

export function getStoryStepById(id: string) {
  return activeStorySteps.find((step) => step.id === id);
}
