import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { Rental } from './entities/rental.entity';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>
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

  async update(id: string, updateRentalDto: UpdateRentalDto) {
    const rental = await this.rentalRepository.findOneBy({ id });

    if (!rental) {
      throw new Error('Rental not found');
    }

    // Check if trying to change payment status
    const isChangingPaymentStatus =
      updateRentalDto.paymentStatus !== undefined ||
      updateRentalDto.isPaid !== undefined;

    if (isChangingPaymentStatus && rental.datePaid) {
      const datePaid = new Date(rental.datePaid);
      const now = new Date();
      const diffInHours =
        (now.getTime() - datePaid.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 48) {
        throw new ForbiddenException(
          'No se puede modificar el estado de pago después de 48 horas de la fecha de pago'
        );
      }
    }

    return this.rentalRepository.update(id, updateRentalDto);
  }

  remove(id: string) {
    return this.rentalRepository.delete(id);
  }
}
