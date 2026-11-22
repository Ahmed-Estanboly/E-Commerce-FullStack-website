import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId } from 'mongoose';
import type { Model } from 'mongoose';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Branch, BranchDocument } from './schemas/branch.schema.js';
import { BranchInventoryService } from './branch-inventory.service.js';
import { UsersService } from '../users/users.service.js';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';

const DEFAULT_BRANCHES = [
  {
    name: 'NOVA City Centre',
    address: 'City Centre, Latakia',
    city: 'Latakia',
    description: 'Central branch serving the nearby shopping and residential districts.',
    phone: '+963 41 000 1001',
  },
  {
    name: 'NOVA Corniche',
    address: 'Corniche Al-Shamali, Latakia',
    city: 'Latakia',
    description: 'Coastal branch serving the northern corniche and waterfront neighborhoods.',
    phone: '+963 41 000 1002',
  },
  {
    name: 'NOVA Mall',
    address: 'Tishreen University Road, Latakia',
    city: 'Latakia',
    description: 'Convenient branch for customers near the university and adjoining districts.',
    phone: '+963 41 000 1003',
  },
];

const LEGACY_BRANCHES = [
  { previousName: 'Main Branch - City Center', name: 'NOVA City Centre', ownerRole: 'branch owner' },
  { previousName: 'Corniche Branch', name: 'NOVA Corniche', ownerRole: 'central owner' },
  { previousName: 'Mall Branch', name: 'NOVA Mall', ownerRole: 'south owner' },
];

@Injectable()
export class BranchesService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    private readonly branchInventoryService: BranchInventoryService,
    private readonly usersService: UsersService,
      @InjectModel(Order.name)
      private readonly orderModel: Model<OrderDocument>,
    ) {}

  async onApplicationBootstrap() {
    for (const legacyBranch of LEGACY_BRANCHES) {
      const currentBranch = await this.branchModel.findOne({ name: legacyBranch.name }).exec();
      if (!currentBranch) {
        await this.branchModel.findOneAndUpdate(
          { name: legacyBranch.previousName },
          { $set: { name: legacyBranch.name } },
          { runValidators: true },
        ).exec();
      }

      const branch = await this.branchModel.findOne({ name: legacyBranch.name }).exec();
      if (branch) {
        await this.usersService.assignLegacyBranchOwner(
          legacyBranch.ownerRole,
          branch._id.toString(),
        );
      }
    }

    for (const branch of DEFAULT_BRANCHES) {
      await this.branchModel.updateOne(
        { name: branch.name },
        { $setOnInsert: branch },
        { upsert: true },
      ).exec();
    }

    for (const legacyBranch of LEGACY_BRANCHES) {
      const branch = await this.branchModel.findOne({ name: legacyBranch.name }).exec();
      if (branch) {
        await this.usersService.assignLegacyBranchOwner(
          legacyBranch.ownerRole,
          branch._id.toString(),
        );
      }
    }

    await this.branchInventoryService.seedDemoInventory();
  }

  async create(dto: CreateBranchDto) {
    if (await this.branchModel.exists({ name: dto.name.trim() })) {
      throw new ConflictException('A branch with this name already exists');
    }

    try {
      const ownerEmail = dto.ownerEmail.trim().toLowerCase();
      const { ownerPassword, ownerName, ...branchData } = dto;
      const branch = await this.branchModel.create({ ...branchData, ownerEmail });
      try {
        await this.usersService.create({
          email: ownerEmail,
          name: ownerName?.trim() || dto.name.trim(),
          password: ownerPassword,
          role: 'branch owner',
          branchId: branch._id.toString(),
        });
      } catch (error) {
        await branch.deleteOne();
        throw error;
      }
      return branch;
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
    const hasOrders = await this.orderModel.exists({
      'branch._id': branch._id.toString(),
    });
    if (hasOrders) {
      throw new ConflictException('This branch cannot be deleted because it has order history.');
    }
    await this.branchInventoryService.removeForBranch(branch._id);
    await this.usersService.removeBranchUsers(branch._id.toString());
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
