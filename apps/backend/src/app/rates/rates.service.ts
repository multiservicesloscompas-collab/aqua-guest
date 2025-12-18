import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRateDto } from './dto/create-rate.dto';
import { UpdateRateDto } from './dto/update-rate.dto';
import { Rate } from './entities/rate.entity';

@Injectable()
export class RatesService {
  constructor(
    @InjectRepository(Rate)
    private rateRepository: Repository<Rate>,
  ) {}

  create(createRateDto: CreateRateDto) {
    const rate = this.rateRepository.create(createRateDto);
    return this.rateRepository.save(rate);
  }

  findAll() {
    return this.rateRepository.find();
  }

  findOne(id: string) {
    return this.rateRepository.findOneBy({ id });
  }

  update(id: string, updateRateDto: UpdateRateDto) {
    return this.rateRepository.update(id, updateRateDto);
  }

  remove(id: string) {
    return this.rateRepository.delete(id);
  }
}
