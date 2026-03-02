import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId;
  image?: string;
  color?: string;
  seo: {
    title?: string;
    description?: string;
  };
  metadata: {
    postCount: number;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogCategorySchema = new Schema<IBlogCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'BlogCategory',
      default: null,
    },
    image: {
      type: String,
    },
    color: {
      type: String,
      default: '#6366f1', // Default indigo color
    },
    seo: {
      title: String,
      description: String,
    },
    metadata: {
      postCount: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BlogCategorySchema.index({ isActive: 1, sortOrder: 1 });
BlogCategorySchema.index({ parent: 1 });

// Pre-save middleware to generate slug
BlogCategorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const BlogCategory: Model<IBlogCategory> = mongoose.models.BlogCategory || mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema);

export default BlogCategory;
