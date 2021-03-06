import { MatDialog } from '@angular/material/dialog';
import { AssetDialogComponent } from 'app/pages/assets/asset/asset.dialog.component';
import { TableCreateAction } from 'app/shared/table/actions/table-create-action';
import { AssetButtonAction } from 'app/types/Asset';
import { TableActionDef } from 'app/types/Table';
import { Observable } from 'rxjs';

export interface TableCreateAssetActionDef extends TableActionDef {
  action: (dialog: MatDialog, refresh?: () => Observable<void>) => void;
}

export class TableCreateAssetAction extends TableCreateAction {
  public getActionDef(): TableCreateAssetActionDef {
    return {
      ...super.getActionDef(),
      id: AssetButtonAction.CREATE_ASSET,
      action: this.createAsset,
    };
  }

  private createAsset(dialog: MatDialog, refresh?: () => Observable<void>) {
    super.create(AssetDialogComponent, dialog, refresh);
  }
}
