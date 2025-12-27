import { BaseDrive } from './base-drive';

export class IonDrive extends BaseDrive {
    readonly thrust = 10;
    readonly name = 'Ion Drive';
    readonly description = 'Standard Ion Drive. Reliable and efficient.';
    readonly TEXTURE_KEY = 'ion-drive';

    // Override defaults if necessary
    visibleOnMount = true;
}
