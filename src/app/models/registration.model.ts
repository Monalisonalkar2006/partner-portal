export class Registration {
    public user: User;
    public account: Account
}

export class User {
    user_id: number;
    user_uuid: string;
    email: string;
    mobile_number: string;
    first_name: string;
    last_name: string;
    password: string;
    cpassword: string;
    image_url: string;
    country_code: string;
    send_activation_email: boolean;
    send_otp: boolean;
}

export class Account {
    name: string = "";
    business_name: string;
    business_address: string;
    business_email: string;
    city: string;
    country_name: string;
    country_cd: string;
    state_code: string = "";
    business_contact_number: string;
    GST: string;
    PAN: string;
    CIN: string;
}
