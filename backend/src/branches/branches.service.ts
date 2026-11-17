import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Branch, BranchDocument } from './schemas/branch.schema.js';
import { BranchInventoryService } from './branch-inventory.service.js';

const DEFAULT_BRANCHES: CreateBranchDto[] = [
  {
    name: 'Main Branch - City Center',
    address: 'City Center',
    phone: '+1 555 010 1001',
  },
  {
    name: 'Corniche Branch',
    address: 'Corniche Road',
    phone: '+1 555 010 1002',
  },
  {
    name: 'Mall Branch',
    address: 'Central Mall',
    phone: '+1 555 010 1003',
  },
];

@Injectable()
export class BranchesService implements OnModuleInit {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    private readonly branchInventoryService: BranchInventoryService,
  ) {}

  async onModuleInit() {
    if ((await this.branchModel.countDocuments().exec()) === 0) {
      await this.branchModel.insertMany(DEFAULT_BRANCHES);
    }
  }

  async create(dto: CreateBranchDto) {
    if (await this.branchModel.exists({ name: dto.name.trim() })) {
      throw new ConflictException('A branch with this name already exists');
    }

    try {
      return await this.branchModel.create(dto);
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new ConflictException('A branch with this name already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.branchModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const branch = await this.findById(id);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.ensureValidId(id);

    if (dto.name && await this.branchModel.exists({ name: dto.name.trim(), _id: { $ne: id } })) {
      throw new ConflictException('A branch with this name already exists');
    }

    try {
      const branch = await this.branchModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .exec();
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
      return branch;
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new ConflictException('A branch with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const branch = await this.findById(id);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.branchInventoryService.removeForBranch(branch._id);
    await branch.deleteOne();
    return branch;
  }

  private async findById(id: string) {
    await this.ensureValidId(id);
    return this.branchModel.findById(id).exec();
  }

  private async ensureValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Branch not found');
    }
  }

  private isDuplicateNameError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
