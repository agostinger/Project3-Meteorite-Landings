-- Create a table schema for our table
CREATE TABLE Meteorite_Landings (
    name VARCHAR(50),
	id INT,
	nametype VARCHAR(10),
	recclass VARCHAR(50),
	mass VARCHAR(20),
	fall VARCHAR(10),
	year INT,
	reclat VARCHAR(20),
	reclong VARCHAR(20),
	GeoLocation VARCHAR(50)
);

-- Import CSV file into the corresponding SQL table.