import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CellContentTemplateDirective } from 'app/shared/table/cell-content-template/cell-content-template.directive';
import { ChipType } from 'app/types/GlobalType';
import { RegistrationToken } from 'app/types/RegistrationToken';
import * as moment from 'moment';

@Component({
  template: `
    <mat-chip-list [selectable]="false">
      <mat-chip [ngClass]="row | appRegistrationTokenStatus:'class'" [disabled]="true">
          {{row | appRegistrationTokenStatus:'text' | translate}}
      </mat-chip>
    </mat-chip-list>
  `,
})
export class RegistrationTokenStatusComponent extends CellContentTemplateDirective {
  @Input() public row!: RegistrationToken;
}

@Pipe({name: 'appRegistrationTokenStatus'})
export class AppRegistrationTokenStatusPipe implements PipeTransform {
  public transform(registrationToken: RegistrationToken, type: string): string {
    if (type === 'class') {
      return this.buildStatusClasses(registrationToken);
    }
    if (type === 'text') {
      return this.buildStatusText(registrationToken);
    }
    return '';
  }

  public buildStatusClasses(registrationToken: RegistrationToken): string {
    let classNames = 'chip-width-5em ';
    if (this.isExpired(registrationToken)) {
      classNames += ChipType.DANGER;
    } else if (this.isRevoked(registrationToken)) {
      classNames += ChipType.WARNING;
    } else {
      classNames += ChipType.SUCCESS;
    }
    return classNames;
  }

  public buildStatusText(registrationToken: RegistrationToken): string {
    if (this.isExpired(registrationToken)) {
      return 'settings.charging_station.registration_token_expired';
    }
    if (this.isRevoked(registrationToken)) {
      return 'settings.charging_station.registration_token_revoked';
    }
    return 'settings.charging_station.registration_token_valid';
  }

  private isExpired(registrationToken: RegistrationToken): boolean {
    return registrationToken.expirationDate && moment().isAfter(registrationToken.expirationDate);
  }

  private isRevoked(registrationToken: RegistrationToken): boolean {
    return registrationToken.revocationDate && moment().isAfter(registrationToken.revocationDate);
  }
}
