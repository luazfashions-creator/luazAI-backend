import { WorkflowDefinition } from '../workflow-engine.service';

export const SEO_ANALYSIS_WORKFLOW: WorkflowDefinition = {
  name: 'SEO Analysis',
  steps: [
    {
      agentType: 'brand-profiler',
      input: {},
    },
    {
      agentType: 'seo',
      input: {},
      dependsOnIndex: [0],
    },
    {
      agentType: 'competitor-analysis',
      input: {},
      dependsOnIndex: [0],
    },
    {
      agentType: 'content',
      input: {},
      dependsOnIndex: [1, 2],
    },
  ],
};

export const CONTENT_GENERATION_WORKFLOW: WorkflowDefinition = {
  name: 'Content Generation',
  steps: [
    {
      agentType: 'brand-profiler',
      input: {},
    },
    {
      agentType: 'seo',
      input: {},
      dependsOnIndex: [0],
    },
    {
      agentType: 'content',
      input: {},
      dependsOnIndex: [0, 1],
    },
  ],
};
