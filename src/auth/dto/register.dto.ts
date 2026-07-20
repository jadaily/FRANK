import { IsEmail, IsString, MinLength, IsIn, IsNumber, IsPositive } from "class-validator";

export class RegisterDto {
    @IsEmail({}, { message: 'Please enter a valid email address.' })
    email!: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long.'})
    password!: string;

    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long.'})
    name!: string;
    
    @IsIn(['male', 'female'])
    sex!: 'male' | 'female';

    @IsNumber()
    @IsPositive()
    bodyweightLbs!: number;
}