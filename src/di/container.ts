import { Container } from 'inversify';
import { sceneServices } from './decorators';

export const container = new Container({ autoBindInjectable: true });

export function bindScene(scene: Phaser.Scene) {
    if (container.isBound('Scene')) {
        container.rebind('Scene').toConstantValue(scene);
    } else {
        container.bind('Scene').toConstantValue(scene);
    }

    // Rebind scene-specific services to ensure they are singletons PER SCENE execution
    // Rebind scene-specific services to ensure they are singletons PER SCENE execution
    sceneServices.forEach(serviceClass => {
        // We use the class constructor itself as the identifier
        if (container.isBound(serviceClass)) {
            container.rebind(serviceClass).to(serviceClass).inSingletonScope();
        } else {
            container.bind(serviceClass).to(serviceClass).inSingletonScope();
        }
    });
}

