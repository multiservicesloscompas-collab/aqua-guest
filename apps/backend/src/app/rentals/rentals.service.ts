import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { Rental } from './entities/rental.entity';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
  ) {}

  create(createRentalDto: CreateRentalDto) {
    const rental = this.rentalRepository.create(createRentalDto);
    return this.rentalRepository.save(rental);
  }

  findAll() {
    return this.rentalRepository.find();
  }

  findOne(id: string) {
    return this.rentalRepository.findOneBy({ id });
  }

  update(id: string, updateRentalDto: UpdateRentalDto) {
    return this.rentalRepository.update(id, updateRentalDto);
  }

  remove(id: string) {
    return this.rentalRepository.delete(id);
  }
}
