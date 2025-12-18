import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  create(createClientDto: CreateClientDto) {
    return this.clientRepository.save(createClientDto);
  }

  findAll() {
    return this.clientRepository.find();
  }

  findOne(id: string) {
    return this.clientRepository.findOneBy({ id });
  }

  update(id: string, updateClientDto: UpdateClientDto) {
    return this.clientRepository.update(id, updateClientDto);
  }

  remove(id: string) {
    return this.clientRepository.delete(id);
  }
}
