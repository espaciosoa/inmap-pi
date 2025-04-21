
export class Measurement {
    constructor({ id, timestamp, name, status , measurementDevice}) {
        this.id = id;               
        this.timestamp = timestamp; 
        this.name = name;                   this.status = status;       
        this.measurementDevice = measurementDevice
        this.measurementOwner = "ESPACIOSOA"

    }

    printSummary() {
        console.log(`[${this.timestamp}] ${this.id}: ${this.name} (${this.status})`);
    }
}

// Example usage:
const entity = new MyEntity({
    id: '123',
    timestamp: new Date().toISOString(),
    name: 'Sample Item',
    status: 'active',
});

entity.printSummary();
