import mongoose from 'mongoose';
import { Template, ITemplate } from '../models/Template';

export class TemplateRepository {
  async findAllForUser(userId?: string) {
    const filter: Record<string, unknown> = {};
    if (userId) {
      filter.$or = [
        { createdBy: null },
        { createdBy: new mongoose.Types.ObjectId(userId) },
      ];
    } else {
      filter.createdBy = null;
    }

    return Template.find(filter)
      .select('id title description category thumbnail estimatedTime pages createdBy')
      .sort({ category: 1, title: 1 });
  }

  async findByPublicId(id: string, userId?: string) {
    const filter: Record<string, unknown> = { id };
    if (userId) {
      filter.$or = [
        { createdBy: null },
        { createdBy: new mongoose.Types.ObjectId(userId) },
      ];
    } else {
      filter.createdBy = null;
    }
    return Template.findOne(filter);
  }

  async upsertMany(samples: Partial<ITemplate>[]) {
    const ops = samples.map((tpl) => ({
      updateOne: {
        filter: { id: tpl.id },
        update: { $setOnInsert: tpl },
        upsert: true,
      },
    }));
    if (ops.length === 0) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 } as any;
    return Template.bulkWrite(ops);
  }

  async findManyByIds(ids: string[]) {
    return Template.find({ id: { $in: ids } }).select('id title category');
  }

  async createTemplate(template: Partial<ITemplate>) {
    const doc = new Template(template);
    return doc.save();
  }

  async updateTemplateForUser(
    id: string,
    userId: string,
    updates: Partial<Pick<ITemplate, 'category' | 'estimatedTime'>>,
  ) {
    return Template.findOneAndUpdate(
      { id, createdBy: new mongoose.Types.ObjectId(userId) },
      { $set: updates },
      { new: true },
    );
  }

  async deleteTemplateForUser(id: string, userId: string) {
    return Template.findOneAndDelete({
      id,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }
}


