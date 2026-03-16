import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';

@Injectable()
export class BrandRepository {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
  ) {}

  async create(data: Partial<Brand>): Promise<BrandDocument> {
    return this.brandModel.create(data);
  }

  async findById(id: string): Promise<BrandDocument | null> {
    return this.brandModel.findById(id);
  }

  async findBySlug(slug: string): Promise<BrandDocument | null> {
    return this.brandModel.findOne({ slug });
  }

  async findByOwner(
    ownerId: string,
    page: number,
    limit: number,
    sort: string,
    order: 'asc' | 'desc',
  ): Promise<{ data: BrandDocument[]; total: number }> {
    const filter = { ownerId: new Types.ObjectId(ownerId) };
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      this.brandModel
        .find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit),
      this.brandModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  async update(id: string, data: Partial<Brand>): Promise<BrandDocument | null> {
    return this.brandModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<BrandDocument | null> {
    return this.brandModel.findByIdAndDelete(id);
  }
}
