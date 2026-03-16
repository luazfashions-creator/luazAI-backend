import { Injectable } from '@nestjs/common';
import { ContentType } from '../shared/enums/content-type.enum';

interface TemplateSection {
  heading: string;
  placeholder: string;
}

export interface ContentTemplate {
  type: ContentType;
  name: string;
  sections: TemplateSection[];
  defaultWordCount: number;
  defaultTone: string;
}

@Injectable()
export class TemplateService {
  private readonly templates: ContentTemplate[] = [
    {
      type: ContentType.BLOG_POST,
      name: 'Standard Blog Post',
      sections: [
        {
          heading: 'Introduction',
          placeholder: 'Hook the reader with a compelling opening',
        },
        {
          heading: 'Main Points',
          placeholder: 'Cover the core topic with subheadings',
        },
        { heading: 'Actionable Tips', placeholder: 'Provide practical advice' },
        {
          heading: 'Conclusion',
          placeholder: 'Summarize key takeaways with CTA',
        },
      ],
      defaultWordCount: 1500,
      defaultTone: 'informative',
    },
    {
      type: ContentType.AD_COPY,
      name: 'Standard Ad Copy',
      sections: [
        {
          heading: 'Headline',
          placeholder: 'Attention-grabbing headline (max 30 chars)',
        },
        {
          heading: 'Description',
          placeholder: 'Value proposition (max 90 chars)',
        },
        { heading: 'CTA', placeholder: 'Clear call-to-action' },
      ],
      defaultWordCount: 100,
      defaultTone: 'persuasive',
    },
    {
      type: ContentType.SOCIAL_POST,
      name: 'Standard Social Post',
      sections: [
        { heading: 'Hook', placeholder: 'Opening line to stop the scroll' },
        { heading: 'Body', placeholder: 'Key message or story' },
        {
          heading: 'CTA + Hashtags',
          placeholder: 'Call-to-action and relevant hashtags',
        },
      ],
      defaultWordCount: 200,
      defaultTone: 'engaging',
    },
  ];

  getTemplates(): ContentTemplate[] {
    return this.templates;
  }

  getTemplatesByType(type: ContentType): ContentTemplate[] {
    return this.templates.filter((t) => t.type === type);
  }

  getTemplate(type: ContentType): ContentTemplate | undefined {
    return this.templates.find((t) => t.type === type);
  }
}
