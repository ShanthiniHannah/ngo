BEGIN TRANSACTION;
CREATE TABLE activity_logs (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	action VARCHAR(255) NOT NULL, 
	details TEXT, 
	timestamp DATETIME, ip_address VARCHAR(45), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "activity_logs" VALUES(1,1,'CHECK_IN','User Shanthini Hannah checked in at 11:19:30.532760','2026-03-23 11:19:30.602986',NULL);
INSERT INTO "activity_logs" VALUES(2,1,'CHECK_OUT','User Shanthini Hannah checked out at 11:19:34.015600','2026-03-23 11:19:34.036170',NULL);
INSERT INTO "activity_logs" VALUES(3,1,'AI_SUGGEST','Generated 2 ML suggestions for Beneficiary ''Murugan S''','2026-03-24 14:48:58.988730',NULL);
INSERT INTO "activity_logs" VALUES(4,1,'AI_SUGGEST','Generated 2 ML suggestions for Beneficiary ''Murugan S''','2026-03-24 14:52:29.399872',NULL);
INSERT INTO "activity_logs" VALUES(5,1,'AI_APPROVE','Approved ML suggestion: Volunteer ''Ananya Krishnan'' → Beneficiary ''Murugan S''','2026-03-24 14:52:34.243740',NULL);
INSERT INTO "activity_logs" VALUES(6,1,'CHECK_IN','User Shanthini Hannah checked in at 16:29:00.597416','2026-03-25 16:29:00.636177',NULL);
INSERT INTO "activity_logs" VALUES(7,1,'CHECK_OUT','User Shanthini Hannah checked out at 16:29:07.360729','2026-03-25 16:29:07.378066',NULL);
INSERT INTO "activity_logs" VALUES(8,2,'CHECK_IN','User Priya Ramesh checked in at 17:01:50.130397','2026-03-25 17:01:50.197678',NULL);
INSERT INTO "activity_logs" VALUES(9,2,'CHECK_OUT','User Priya Ramesh checked out at 17:01:56.271882','2026-03-25 17:01:56.284393',NULL);
INSERT INTO "activity_logs" VALUES(10,1,'AI_SUGGEST','Generated 2 ML suggestions for Beneficiary ''Murugan S''','2026-03-25 17:54:47.286989',NULL);
INSERT INTO "activity_logs" VALUES(11,1,'BENEFICIARY_APPROVED','Approved Beneficiary #3: Gopal T','2026-03-26 07:49:04.909453','127.0.0.1');
INSERT INTO "activity_logs" VALUES(12,1,'AI_SUGGEST','Generated 1 ML suggestions for Beneficiary ''Gopal T''','2026-03-26 07:49:25.691170','127.0.0.1');
CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO "alembic_version" VALUES('08c058eb7565');
CREATE TABLE allocation_suggestions (
	id INTEGER NOT NULL, 
	beneficiary_id INTEGER NOT NULL, 
	volunteer_id INTEGER NOT NULL, 
	score FLOAT, 
	skill_match BOOLEAN, 
	workload INTEGER, 
	status VARCHAR(20), 
	reason TEXT, 
	suggested_at DATETIME, 
	reviewed_by INTEGER, 
	reviewed_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(beneficiary_id) REFERENCES beneficiaries (id), 
	FOREIGN KEY(volunteer_id) REFERENCES volunteers (id), 
	FOREIGN KEY(reviewed_by) REFERENCES users (id)
);
INSERT INTO "allocation_suggestions" VALUES(1,1,2,7.0,1,0,'Approved',NULL,'2026-03-24 14:52:29.392846',1,'2026-03-24 14:52:34.204438');
INSERT INTO "allocation_suggestions" VALUES(2,1,3,7.0,1,0,'Rejected','Another suggestion was approved','2026-03-24 14:52:29.392846',1,'2026-03-24 14:52:34.211227');
INSERT INTO "allocation_suggestions" VALUES(3,1,3,7.0,1,0,'Pending',NULL,'2026-03-25 17:54:47.266188',NULL,NULL);
INSERT INTO "allocation_suggestions" VALUES(4,1,2,6.0,1,1,'Pending',NULL,'2026-03-25 17:54:47.267188',NULL,NULL);
INSERT INTO "allocation_suggestions" VALUES(5,3,2,6.0,1,1,'Pending',NULL,'2026-03-26 07:49:25.678732',NULL,NULL);
CREATE TABLE applications (
	id INTEGER NOT NULL, 
	application_type VARCHAR(20) NOT NULL, 
	status VARCHAR(30), 
	full_name VARCHAR(100) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	phone VARCHAR(20), 
	address VARCHAR(255), 
	age INTEGER, 
	gender VARCHAR(20), 
	occupation VARCHAR(100), 
	id_proof_type VARCHAR(50), 
	id_proof_number VARCHAR(50), 
	education VARCHAR(255), 
	work_experience TEXT, 
	previous_ngo_experience TEXT, 
	skills VARCHAR(255), 
	availability VARCHAR(100), 
	donation_capacity VARCHAR(100), 
	reference_name VARCHAR(100), 
	reference_contact VARCHAR(100), 
	criminal_record BOOLEAN, 
	criminal_details TEXT, 
	is_christian BOOLEAN, 
	years_as_believer INTEGER, 
	church_name VARCHAR(150), 
	church_location VARCHAR(150), 
	pastor_name VARCHAR(100), 
	pastor_contact VARCHAR(100), 
	spiritual_gifts VARCHAR(255), 
	ministry_involvement TEXT, 
	personal_testimony TEXT, 
	reason_to_join TEXT, 
	agrees_to_statement BOOLEAN, 
	interview_date DATETIME, 
	interview_notes TEXT, 
	reviewed_by INTEGER, 
	rejection_reason TEXT, 
	photo_filename VARCHAR(255), 
	submitted_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(reviewed_by) REFERENCES users (id)
);
CREATE TABLE attendance (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	date DATE, 
	status VARCHAR(20), 
	check_in_time TIME, 
	check_out_time TIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "attendance" VALUES(1,1,'2026-03-23','Present','11:19:30.532760','11:19:34.015600');
INSERT INTO "attendance" VALUES(2,1,'2026-03-25','Present','16:29:00.597416','16:29:07.360729');
INSERT INTO "attendance" VALUES(3,2,'2026-03-25','Present','17:01:50.130397','17:01:56.271882');
CREATE TABLE beneficiaries (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	email VARCHAR(100), 
	phone VARCHAR(20), 
	age INTEGER, 
	gender VARCHAR(20), 
	needs TEXT, 
	status VARCHAR(50), 
	assigned_volunteer_id INTEGER, 
	photo_filename VARCHAR(255), 
	created_at DATETIME, document_path VARCHAR(255), 
	PRIMARY KEY (id), 
	FOREIGN KEY(assigned_volunteer_id) REFERENCES volunteers (id)
);
INSERT INTO "beneficiaries" VALUES(1,'Murugan S','murugan.ben@ngo.com',NULL,45,'Male','Food, Medical Support','Approved',2,NULL,'2026-03-23 09:50:30.163892',NULL);
INSERT INTO "beneficiaries" VALUES(2,'Selvi R','selvi.ben@ngo.com',NULL,38,'Female','Shelter, Education for children','Approved',NULL,NULL,'2026-03-23 09:50:30.323121',NULL);
INSERT INTO "beneficiaries" VALUES(3,'Gopal T','gopal.ben@ngo.com',NULL,60,'Male','Medical, Elderly Care','Approved',NULL,NULL,'2026-03-23 09:50:30.465991',NULL);
INSERT INTO "beneficiaries" VALUES(4,'Preethi M','preethi.ben@ngo.com',NULL,22,'Female','Education, Counseling','Pending',NULL,NULL,'2026-03-23 09:50:30.596997',NULL);
CREATE TABLE deliverables (
	id INTEGER NOT NULL, 
	project_id INTEGER NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	due_date DATE, 
	status VARCHAR(20), 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);
CREATE TABLE donors (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	phone VARCHAR(20), 
	address VARCHAR(255), 
	donation_amount FLOAT, 
	last_donation_date DATETIME, 
	created_at DATETIME, 
	user_id INTEGER, transaction_id VARCHAR(100), 
	PRIMARY KEY (id), 
	UNIQUE (email), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);
INSERT INTO "donors" VALUES(1,'Lakshmi Venkat','lakshmi.donor@ngo.com','9900001111','5 Boat Club Rd, Chennai',25000.0,NULL,'2026-03-23 09:50:29.751064',13,NULL);
INSERT INTO "donors" VALUES(2,'Ramesh Iyer','ramesh.donor@ngo.com','9900002222','18 MRC Nagar, Chennai',50000.0,NULL,'2026-03-23 09:50:29.879922',14,NULL);
INSERT INTO "donors" VALUES(3,'Sunita Mehta','sunita.donor@ngo.com','9900003333','30 ECR, Chennai',15000.0,NULL,'2026-03-23 09:50:30.029306',15,NULL);
CREATE TABLE employees (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	name VARCHAR(100) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	age INTEGER, 
	gender VARCHAR(20), 
	address VARCHAR(255), 
	sponsor VARCHAR(100), 
	hr_id INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	UNIQUE (email), 
	FOREIGN KEY(hr_id) REFERENCES users (id)
);
INSERT INTO "employees" VALUES(1,4,'Karthik Rajan','karthik@ngo.com',29,'Male','12 Anna Salai, Chennai','Tech NGO',NULL,'2026-03-23 09:50:28.508571');
INSERT INTO "employees" VALUES(2,5,'Deepa Sundar','deepa@ngo.com',26,'Female','45 OMR, Chennai','Care Trust',NULL,'2026-03-23 09:50:28.613425');
INSERT INTO "employees" VALUES(3,6,'Vignesh Mohan','vignesh@ngo.com',31,'Male','78 T Nagar, Chennai','Hope Fund',NULL,'2026-03-23 09:50:28.748966');
INSERT INTO "employees" VALUES(4,7,'Meera Nair','meera@ngo.com',27,'Female','22 Adyar, Chennai','Bright NGO',NULL,'2026-03-23 09:50:28.927700');
CREATE TABLE leaves (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	reason VARCHAR(255), 
	status VARCHAR(20), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE TABLE otp_verifications (
	id INTEGER NOT NULL, 
	phone_number VARCHAR(20) NOT NULL, 
	otp_hash VARCHAR(64) NOT NULL, 
	expiry_time DATETIME NOT NULL, 
	attempts INTEGER, 
	verified BOOLEAN, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "otp_verifications" VALUES(3,'9876501234','891075a1e8d4a7015ecc75b637cdda6143e450acfe0c2fd86e5316ed8fbd65d4','2026-03-25 17:29:52.599062',0,1,'2026-03-25 17:24:52.606160');
INSERT INTO "otp_verifications" VALUES(4,'9900002222','d04ef549db98e17ac14dc32b898849919624a1422f4c7d5e83e57bd0f0ad3a0d','2026-03-25 17:40:19.026742',0,1,'2026-03-25 17:35:19.032387');
INSERT INTO "otp_verifications" VALUES(5,'9900001111','eb44d24051daf82e50aa8e69e447f202953d36fa130f2cfc2e37f442f4f3ddaf','2026-03-25 18:13:55.063487',0,1,'2026-03-25 18:08:55.080230');
CREATE TABLE projects (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	start_date DATE, 
	end_date DATE, 
	status VARCHAR(20), 
	budget FLOAT, 
	PRIMARY KEY (id)
);
CREATE TABLE reports (
	id INTEGER NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	content TEXT NOT NULL, 
	generated_by INTEGER NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(generated_by) REFERENCES users (id)
);
CREATE TABLE roles (
	id INTEGER NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	description VARCHAR(200), 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
INSERT INTO "roles" VALUES(1,'Admin','Admin role');
INSERT INTO "roles" VALUES(2,'HR','HR role');
INSERT INTO "roles" VALUES(3,'Employee','Employee role');
INSERT INTO "roles" VALUES(4,'Volunteer','Volunteer role');
INSERT INTO "roles" VALUES(5,'Donor','Donor role');
INSERT INTO "roles" VALUES(6,'Beneficiary','Beneficiary role');
CREATE TABLE service_acknowledgments (
	id INTEGER NOT NULL, 
	beneficiary_id INTEGER NOT NULL, 
	volunteer_id INTEGER NOT NULL, 
	rating INTEGER NOT NULL, 
	feedback TEXT, 
	service_type VARCHAR(100), 
	status VARCHAR(30), 
	acknowledged_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(beneficiary_id) REFERENCES beneficiaries (id), 
	FOREIGN KEY(volunteer_id) REFERENCES volunteers (id)
);
INSERT INTO "service_acknowledgments" VALUES(1,1,2,5,NULL,'Medical Support','Satisfied','2026-03-24 17:14:13.222209');
CREATE TABLE spiritual_growth (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	date DATE, 
	activity_type VARCHAR(100) NOT NULL, 
	duration INTEGER, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE TABLE sponsorships (
	id INTEGER NOT NULL, 
	sponsor_name VARCHAR(100) NOT NULL, 
	amount FLOAT NOT NULL, 
	date DATETIME, 
	donor_id INTEGER, 
	project_id INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(donor_id) REFERENCES donors (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);
CREATE TABLE users (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	password VARCHAR(255) NOT NULL, 
	role_id INTEGER NOT NULL, 
	created_at DATETIME, failed_login_attempts INTEGER, locked_until DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (email), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
);
INSERT INTO "users" VALUES(1,'Shanthini Hannah','shanthini@ngo.com','scrypt:32768:8:1$pntPVmTonh3JLvPr$89dac49af55d929adfbfdb669775c1245a5b2a842802308a9030b0b50f7592e8a6e5b12303021eda9e381360dbfc2d0af46867d1ff762762a7bdff87fbb75568',1,'2026-03-23 09:50:28.092341',0,NULL);
INSERT INTO "users" VALUES(2,'Priya Ramesh','priya.hr@ngo.com','scrypt:32768:8:1$w6jC7kI1q4x3W58T$d44a6d02b6da9a99f4f4bc58233bb1ffec4a33816c0cf461ccf17b75f41cd7cddb5e2d59233e3b97f31eb6487275e1fd8021af0cc901d150d8faa1db1346cb06',2,'2026-03-23 09:50:28.231861',NULL,NULL);
INSERT INTO "users" VALUES(3,'Arjun Kumar','arjun.hr@ngo.com','scrypt:32768:8:1$dGfj7Kas2WMb3dcD$44b1dd9dffbd15695b076079cd6d4c437ab20074d9647d7fe3451a3bbd6fb6783822324ed45a51d05293f74d9d6de9f62621f61bae46a9782fb0f5e77dc6ac68',2,'2026-03-23 09:50:28.352536',NULL,NULL);
INSERT INTO "users" VALUES(4,'Karthik Rajan','karthik@ngo.com','scrypt:32768:8:1$O558pqEDhZ3y8vVE$3f36db1078fc4dbe38f62142fc3b9e773c6884504f5bc324749b8ddd9bd36d0c800be6531391da8b57ee67c7e65afbfc51b579fd1b6d420068f31b6e5fa0acfc',3,'2026-03-23 09:50:28.463980',NULL,NULL);
INSERT INTO "users" VALUES(5,'Deepa Sundar','deepa@ngo.com','scrypt:32768:8:1$r1xaN2G6AGH6ZAQy$47ebb0c5e9c656cbf40ced073e01888456ae006c6c0342f435f4b012ef3d3e5179dab3f0a0195fc185646bd7263da0eea7e2e41bec0829e28072946e43a58f31',3,'2026-03-23 09:50:28.612423',NULL,NULL);
INSERT INTO "users" VALUES(6,'Vignesh Mohan','vignesh@ngo.com','scrypt:32768:8:1$fWhRZkVA4sAiJk3b$c91722a92d3801023b74ed5acc63174cd9012af81776059c47af38a6988aae45ce6428a684b73ea31cfb0cccd88c56b5fefd653c8c7a69925d96a996a79bd159',3,'2026-03-23 09:50:28.747966',NULL,NULL);
INSERT INTO "users" VALUES(7,'Meera Nair','meera@ngo.com','scrypt:32768:8:1$xyk4L1w9Whh69e04$a88be0b2c7329594f4f32184e4989a0d64c644eeaf23e2e278ce6836e495135b8dff4d5ae693d0a80b07bc6a044db0a6e2fb5f895ab8c5e7104bb8734283e759',3,'2026-03-23 09:50:28.924699',NULL,NULL);
INSERT INTO "users" VALUES(8,'Ravi Shankar','ravi@ngo.com','scrypt:32768:8:1$d0FJv97vlJ18MtfU$1f3c7d67b961f7106e48d826889fdf467ef96bbeef653b284e9dbb9fd7bab484942d0c041ab06ff0302d93d5b4009595079e6d51d6ca390868e04f58bc3390d4',4,'2026-03-23 09:50:29.060019',NULL,NULL);
INSERT INTO "users" VALUES(9,'Ananya Krishnan','ananya@ngo.com','scrypt:32768:8:1$HgUaLqLOMJGnQ0Vr$48a41fe70d0d34c58ccc7ca8cbbf0fa9a56600dac82ef1c1e114c1d5577796f2b41f653d8e4f522ec027c4a8023272f90026e405986f381ae401ea51346a0243',4,'2026-03-23 09:50:29.213985',NULL,NULL);
INSERT INTO "users" VALUES(10,'Suresh Babu','suresh@ngo.com','scrypt:32768:8:1$6dP3YjkgS2zB4cHc$9adb2bf0a587c4bc0a8d0d5f52960dc5fc56d647158a3107527c778c7bf11f06eb9d7830e456e6f396f8b72b344fa0d05049f011cf36eb67282576a2e10fafe8',4,'2026-03-23 09:50:29.331204',NULL,NULL);
INSERT INTO "users" VALUES(11,'Kavitha Selvan','kavitha@ngo.com','scrypt:32768:8:1$2FLq8I95sYtEN1vF$1417795eb487989b1afc9f0968b7eb4fd0d34e438f10ca77532185faea5f6266a84129203ea9c3357ec0c356f8e9bf662288cec745ee50847ea2027870a50941',4,'2026-03-23 09:50:29.467128',NULL,NULL);
INSERT INTO "users" VALUES(12,'Manoj Pillai','manoj@ngo.com','scrypt:32768:8:1$PMqMlnugim1TOeUq$3641c0a04ddc75aac1bdc269ef18f6c8bb0d9d3e2382c9c50cfc4bfca7c4db5696e177bc57dd6467532a2bab8a0b4b0f54ea34990f9eb101c7b6aaaa020f0102',4,'2026-03-23 09:50:29.613650',NULL,NULL);
INSERT INTO "users" VALUES(13,'Lakshmi Venkat','lakshmi.donor@ngo.com','scrypt:32768:8:1$KqRKihsb7QWmSql0$facbb913ce83c223ba1aa415b3826296653e991166185c2c61720c69480b52a69d841086992e76e6d5a90b5e3f5f2983c5232761f149c96592c6e0634feeddd5',5,'2026-03-23 09:50:29.748065',NULL,NULL);
INSERT INTO "users" VALUES(14,'Ramesh Iyer','ramesh.donor@ngo.com','scrypt:32768:8:1$HhNTipBHSY5i4D9b$90ea38b1ddd396c9dc7cdcaf8190baa08843561ae703d13ec6a740c878dc2ac8ab7f1c54fa8086c069649e2ade3330f784630e64763972c1cafc46b7c9b4f7ea',5,'2026-03-23 09:50:29.879922',NULL,NULL);
INSERT INTO "users" VALUES(15,'Sunita Mehta','sunita.donor@ngo.com','scrypt:32768:8:1$oOyBXQDGyjaJpD0e$52602b1fcdbc85501f3f7cbf10199eaa7419195a83b24f9ab5a7f629c5ba5b5f4743404e357dc20496b6e58fd30f9156bfa36eee01af002b3d27ed997f681691',5,'2026-03-23 09:50:30.028307',NULL,NULL);
INSERT INTO "users" VALUES(16,'Murugan S','murugan.ben@ngo.com','scrypt:32768:8:1$qy4Gq9p5vfA0lyl1$906321ce05a9666da4de08c3437932c278e70d6419813a1fde6c4a7d491586d89dc6d3f9245dfb6427f76165c1d51a51cb348fcc9967147a0b821299a6907fd0',6,'2026-03-23 09:50:30.160889',NULL,NULL);
INSERT INTO "users" VALUES(17,'Selvi R','selvi.ben@ngo.com','scrypt:32768:8:1$ZqIZm38bd6LTRAqI$65d26782f194ad5f1795976c4b9f4a013363fdde42e25da29b710951d25d342bc5c410eb048d06b126634f7420dace678b95ab65d49e8179ff89b21a37b8bda9',6,'2026-03-23 09:50:30.322125',NULL,NULL);
INSERT INTO "users" VALUES(18,'Gopal T','gopal.ben@ngo.com','scrypt:32768:8:1$dJaycu33udipFduL$316a0b09dd02109fc18b7386a2f0657442de1d452a052d82dd510c65a939c707129698f85c1d62a1ff4196fa94b8a3dc8eec5b101621fcbf5cadca88a8501334',6,'2026-03-23 09:50:30.464959',NULL,NULL);
INSERT INTO "users" VALUES(19,'Preethi M','preethi.ben@ngo.com','scrypt:32768:8:1$hXs8PXM83diD4r0R$0eefba1d68d7349188bbb088fae0c9de22ce4c5759047746b9ff1014b3ee652fd2c98b4c0e87e614c5ef009a2812e544352dc1802a342afe9705f4643b3dda9c',6,'2026-03-23 09:50:30.595998',NULL,NULL);
CREATE TABLE volunteers (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	email VARCHAR(100) NOT NULL, 
	phone VARCHAR(20), 
	skills VARCHAR(255), 
	availability VARCHAR(100), 
	created_at DATETIME, 
	user_id INTEGER, 
	PRIMARY KEY (id), 
	UNIQUE (email), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);
INSERT INTO "volunteers" VALUES(1,'Ravi Shankar','ravi@ngo.com','9876501234','Teaching, Mentoring','Weekends','2026-03-23 09:50:29.062021',8);
INSERT INTO "volunteers" VALUES(2,'Ananya Krishnan','ananya@ngo.com','9876502345','Medical, First Aid','Weekdays','2026-03-23 09:50:29.214987',9);
INSERT INTO "volunteers" VALUES(3,'Suresh Babu','suresh@ngo.com','9876503456','Cooking, Food Service','Evenings','2026-03-23 09:50:29.332199',10);
INSERT INTO "volunteers" VALUES(4,'Kavitha Selvan','kavitha@ngo.com','9876504567','Counseling, Education','Weekends','2026-03-23 09:50:29.468592',11);
INSERT INTO "volunteers" VALUES(5,'Manoj Pillai','manoj@ngo.com','9876505678','Driving, Logistics','Flexible','2026-03-23 09:50:29.615060',12);
CREATE INDEX ix_otp_verifications_phone_number ON otp_verifications (phone_number);
COMMIT;
