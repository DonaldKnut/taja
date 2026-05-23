import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPage extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published';
  type: 'page' | 'faq' | 'policy' | 'help';
  featuredImage?: string;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    noIndex?: boolean;
  };
  metadata: {
    views: number;
    lastModifiedBy?: mongoose.Types.ObjectId;
  };
  template?: string;
  sidebar?: {
    enabled: boolean;
    content?: string;
  };
  showInFooter: boolean;
  showInHeader: boolean;
  sortOrder: number;
  parent?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    type: {
      type: String,
      enum: ['page', 'faq', 'policy', 'help'],
      default: 'page',
      index: true,
    },
    featuredImage: {
      type: String,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String,
      noIndex: { type: Boolean, default: false },
    },
    metadata: {
      views: { type: Number, default: 0 },
      lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    template: {
      type: String,
      default: 'default',
    },
    sidebar: {
      enabled: { type: Boolean, default: false },
      content: String,
    },
    showInFooter: {
      type: Boolean,
      default: false,
    },
    showInHeader: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Page',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PageSchema.index({ status: 1, type: 1 });
PageSchema.index({ showInFooter: 1, sortOrder: 1 });
PageSchema.index({ showInHeader: 1, sortOrder: 1 });
PageSchema.index({ type: 1, status: 1 });

// Pre-save middleware to generate slug
PageSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Page: Model<IPage> = mongoose.models.Page || mongoose.model<IPage>('Page', PageSchema);

export default Page;
