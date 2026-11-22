import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateBranchDto } from './create-branch.dto.js';

export class UpdateBranchDto extends PartialType(
  PickType(
    CreateBranchDto,
    ['name', 'address', 'city', 'description', 'phone', 'workingHours', 'isActive'] as const,
  ),
) {}
