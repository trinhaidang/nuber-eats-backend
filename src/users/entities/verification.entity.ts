import { v4 as uuidv4 } from 'uuid';
import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity, JoinColumn, OneToOne, BeforeInsert } from "typeorm";
import { User } from "./user.entity";



@InputType({isAbstract: true})
@ObjectType()
@Entity()
export class Verification extends CoreEntity {

    @Column()
    @Field(type => String)
    code: string

    @OneToOne(type => User)
    @JoinColumn()
    user: User;

    @BeforeInsert()
    createCode(): void {
        this.code = uuidv4();
    }

}