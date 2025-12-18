import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from './entities/sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
  ) {}

  create(createSaleDto: CreateSaleDto) {
    const sale = this.saleRepository.create(createSaleDto);
    return this.saleRepository.save(sale);
  }

  findAll() {
    return this.saleRepository.find({ relations: ['products'] });
  }

  findOne(id: string) {
    return this.saleRepository.findOne({
      where: { id },
      relations: ['products'],
    });
  }

  update(id: string, updateSaleDto: UpdateSaleDto) {
    return this.saleRepository.save({ id, ...updateSaleDto });
  }

  remove(id: string) {
    return this.saleRepository.delete(id);
  }
}
