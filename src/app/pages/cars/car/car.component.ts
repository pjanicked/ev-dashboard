import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from 'app/services/authorization.service';
import { CentralServerService } from 'app/services/central-server.service';
import { DialogService } from 'app/services/dialog.service';
import { MessageService } from 'app/services/message.service';
import { SpinnerService } from 'app/services/spinner.service';
import { CarCatalogsDialogComponent } from 'app/shared/dialogs/car-catalogs/car-catalogs-dialog.component';
import { CarConvertersDialogComponent } from 'app/shared/dialogs/car-converters/car-converters-dialog.component';
import { Car, CarCatalog, CarImage, CarType } from 'app/types/Car';
import { ActionResponse } from 'app/types/DataResult';
import { KeyValue, RestResponse } from 'app/types/GlobalType';
import { HTTPError } from 'app/types/HTTPError';
import { ButtonType } from 'app/types/Table';
import { UserCar } from 'app/types/User';
import { Cars } from 'app/utils/Cars';
import { Utils } from 'app/utils/Utils';
import { CarUsersEditableTableDataSource } from './car-users-editable-table-data-source';


@Component({
  selector: 'app-car',
  templateUrl: 'car.component.html',
  providers: [
    CarUsersEditableTableDataSource
  ],
})
export class CarComponent implements OnInit {
  @Input() public currentCarID!: string;
  @Input() public inDialog!: boolean;
  @Input() public dialogRef!: MatDialogRef<any>;

  public isBasic: boolean;
  public selectedCarCatalog: CarCatalog;
  public isAdmin: boolean;
  public formGroup!: FormGroup;
  public id!: AbstractControl;
  public vin!: AbstractControl;
  public licensePlate!: AbstractControl;
  public isCompanyCar!: AbstractControl;
  public carCatalogID!: AbstractControl;
  public carCatalog!: AbstractControl;
  public converter!: AbstractControl;
  public converterType!: AbstractControl;
  public isDefault!: AbstractControl;
  public type!: AbstractControl;
  public noImage = CarImage.NO_IMAGE;
  public owner = true;
  public carTypes: KeyValue[] = [
    { key: CarType.COMPANY, value: 'cars.company_car' },
    { key: CarType.PRIVATE, value: 'cars.private_car' }
  ];
  public isPool = false;
  public CarType = CarType;
  private car: Car;

  constructor(
    public carUsersEditableTableDataSource: CarUsersEditableTableDataSource,
    public spinnerService: SpinnerService,
    private centralServerService: CentralServerService,
    private messageService: MessageService,
    private translateService: TranslateService,
    private dialogService: DialogService,
    private router: Router,
    private dialog: MatDialog,
    private authorizationService: AuthorizationService) {
    this.isBasic = this.authorizationService.isBasic();
    this.isAdmin = this.authorizationService.isAdmin();
    if (this.isAdmin) {
      this.carTypes.push({ key: CarType.POOL_CAR, value: 'cars.pool_car' });
    }
  }

  public ngOnInit() {
    // Init the form
    this.formGroup = new FormGroup({
      id: new FormControl(''),
      vin: new FormControl('',
        Validators.compose([
          Validators.required,
          Cars.validateVIN
        ])),
      licensePlate: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      carCatalog: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      carCatalogID: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      converter: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      converterType: new FormControl('',
        Validators.compose([
          Validators.required,
        ])),
      isDefault: new FormControl(''),
      type: new FormControl(CarType.COMPANY,
        Validators.compose([
          Validators.required,
        ])),
    });
    // Form
    this.id = this.formGroup.controls['id'];
    this.vin = this.formGroup.controls['vin'];
    this.licensePlate = this.formGroup.controls['licensePlate'];
    this.carCatalogID = this.formGroup.controls['carCatalogID'];
    this.carCatalog = this.formGroup.controls['carCatalog'];
    this.isDefault = this.formGroup.controls['isDefault'];
    this.converter = this.formGroup.controls['converter'];
    this.converterType = this.formGroup.controls['converterType'];
    this.type = this.formGroup.controls['type'];
    // Default
    this.converter.disable();
    if (!this.isBasic) {
      this.isDefault.disable();
    }
    // Check for Updates
    this.carUsersEditableTableDataSource.getTableChangedSubject().subscribe((carUsers: UserCar[]) => {
      this.formGroup.markAsDirty();
    });
    // Register events
    this.type.valueChanges.subscribe((value) => {
      this.isPool = (value === CarType.POOL_CAR);
    });
    // Set car
    this.carUsersEditableTableDataSource.setCarID(this.currentCarID);
    this.loadCar();
  }

  public onClose() {
    this.closeDialog();
  }

  public loadCar() {
    if (this.currentCarID) {
      this.spinnerService.show();
      this.centralServerService.getCar(this.currentCarID).subscribe((car: Car) => {
        this.spinnerService.hide();
        this.car = car;
        // Init form
        this.id.setValue(car.id);
        this.vin.setValue(car.vin);
        this.licensePlate.setValue(car.licensePlate);
        this.carCatalogID.setValue(car.carCatalogID);
        this.type.setValue(car.type);
        this.converterType.setValue(car.converterType);
        const converter = car.carCatalog.chargeStandardTables.find((element) => {
          return element.type === this.car.converterType;
        });
        if (converter) {
          this.converter.setValue(
            Utils.buildConverterName(converter, this.translateService));
          this.converter.enable();
        }
        this.selectedCarCatalog = car.carCatalog;
        this.carCatalog.setValue(Utils.buildCarCatalogName(car.carCatalog));
        // Set default car
        if (this.isBasic) {
          // Fill in props
          const foundCarUser = car.carUsers.find((carUser) => carUser.user.id === this.centralServerService.getLoggedUser().id);
          this.isDefault.setValue(foundCarUser.default);
          this.owner = foundCarUser.owner;
          if (!foundCarUser.owner) {
            this.carCatalog.disable();
            this.converter.disable();
            this.vin.disable();
            this.licensePlate.disable();
            this.type.disable();
          }
        }
        this.formGroup.updateValueAndValidity();
        this.formGroup.markAsPristine();
        this.formGroup.markAllAsTouched();
        // Yes, get image
      }, (error) => {
        this.spinnerService.hide();
        switch (error.status) {
          case HTTPError.OBJECT_DOES_NOT_EXIST_ERROR:
            this.messageService.showErrorMessage('cars.car_not_found');
            break;
          default:
            Utils.handleHttpError(error, this.router, this.messageService,
              this.centralServerService, 'cars.car_error');
        }
      });
    }
  }

  public closeDialog(saved: boolean = false) {
    if (this.inDialog) {
      this.dialogRef.close(saved);
    }
  }

  public close() {
    Utils.checkAndSaveAndCloseDialog(this.formGroup, this.dialogService,
      this.translateService, this.saveCar.bind(this), this.closeDialog.bind(this));
  }

  public saveCar(car: Car) {
    if (this.currentCarID) {
      this.updateCar(car);
    } else {
      this.createCar(car);
    }
  }

  private updateCar(car: Car) {
    // Set updated/removed users
    if (this.isAdmin) {
      car['usersUpserted'] = this.carUsersEditableTableDataSource.getUpsertedUsers();
      car['usersRemoved'] = this.carUsersEditableTableDataSource.getRemovedCarUsers();
    } else {
      const foundCarUser = this.car.carUsers.find((carUser) => carUser.user.id === this.centralServerService.getLoggedUser().id);
      foundCarUser.default = this.isDefault.value as boolean;
      car['usersUpserted'] = [foundCarUser];
    }
    // Update
    this.spinnerService.show();
    this.centralServerService.updateCar(car).subscribe((response: ActionResponse) => {
      this.spinnerService.hide();
      if (response.status === RestResponse.SUCCESS) {
        this.messageService.showSuccessMessage('cars.update_success');
        this.closeDialog(true);
      } else {
        Utils.handleError(JSON.stringify(response), this.messageService, 'cars.update_error');
      }
    }, (error) => {
      this.spinnerService.hide();
      // Check status
      switch (error.status) {
        case HTTPError.USER_NOT_OWNER_OF_THE_CAR:
          this.messageService.showErrorMessage('cars.user_not_owner');
          break;
        case HTTPError.NO_CAR_FOR_USER:
          this.messageService.showErrorMessage('cars.car_not_found');
          break;
        default:
          Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'cars.update_error');
      }
    });
  }

  private createCar(car: Car, forced = false) {
    // Set updated/removed users
    if (this.isAdmin) {
      car['usersUpserted'] = this.carUsersEditableTableDataSource.getUpsertedUsers();
    } else {
      // Create User Car
      car['usersUpserted'] = [{
        user: this.centralServerService.getLoggedUser(),
        default:  this.isDefault.value as boolean,
      }];
    }
    this.spinnerService.show();
    this.centralServerService.createCar(car, forced).subscribe((response: ActionResponse) => {
      this.spinnerService.hide();
      if (response.status === RestResponse.SUCCESS) {
        this.messageService.showSuccessMessage('cars.create_success', { carName: Utils.buildCarCatalogName(this.selectedCarCatalog) });
        this.closeDialog(true);
      } else {
        Utils.handleError(JSON.stringify(response), this.messageService, 'cars.create_error');
      }
    }, (error) => {
      this.spinnerService.hide();
      // Check status
      switch (error.status) {
        // Email already exists
        case HTTPError.CAR_ALREADY_EXIST_ERROR_DIFFERENT_USER:
          this.dialogService.createAndShowYesNoDialog(
            this.translateService.instant('settings.car.assign_user_to_car_dialog_title'),
            this.translateService.instant('settings.car.assign_user_to_car_dialog_confirm'),
          ).subscribe((response) => {
            if (response === ButtonType.YES) {
              this.createCar(car, true);
            }
          });
          break;
        // Car already created by this user
        case HTTPError.CAR_ALREADY_EXIST_ERROR:
          this.messageService.showErrorMessage('cars.car_exist');
          break;
        // User already assigned
        case HTTPError.USER_ALREADY_ASSIGNED_TO_CAR:
          this.messageService.showErrorMessage('cars.user_already_assigned');
          break;
        // No longer exists!
        default:
          Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'cars.create_error');
      }
    });
  }

  public changeCarCatalog() {
    // Create the dialog
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'transparent-dialog-container';
    dialogConfig.data = {
      title: 'cars.assign_car_catalog',
      validateButtonTitle: 'general.select',
      rowMultipleSelection: false,
    };
    // Open
    this.dialog.open(CarCatalogsDialogComponent, dialogConfig).afterClosed().subscribe((result) => {
      if (result && result.length > 0 && result[0] && result[0].objectRef) {
        const carCatalog: CarCatalog = (result[0].objectRef) as CarCatalog;
        this.carCatalogID.setValue(result[0].key);
        this.carCatalog.setValue(Utils.buildCarCatalogName(carCatalog));
        this.selectedCarCatalog = carCatalog;
        // Clear converter
        this.converterType.setValue('');
        this.converter.setValue('');
        this.converter.enable();
        this.formGroup.markAsDirty();
      }
    });
  }

  public changeConverter() {
    // Create the dialog
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'transparent-dialog-container';
    dialogConfig.data = {
      carCatalog: this.selectedCarCatalog,
      title: 'cars.assign_converter',
      validateButtonTitle: 'general.select',
      rowMultipleSelection: false,
    };
    // Open
    this.dialog.open(CarConvertersDialogComponent, dialogConfig).afterClosed().subscribe((result) => {
      if (result && result.length > 0 && result[0] && result[0].objectRef) {
        this.converter.setValue(result[0].value);
        this.converterType.setValue(result[0].key);
        this.formGroup.markAsDirty();
      }
    });
  }
}
