import { FilterType, TableFilterDef } from 'app/types/Table';
import * as moment from 'moment';

import { TableFilter } from './table-filter';

export class DateTableFilter extends TableFilter {
  constructor() {
    super();
    // Define filter
    const filterDef: TableFilterDef = {
      id: 'timestamp',
      httpId: 'Date',
      type: FilterType.DATE,
      name: 'general.search_date',
      currentValue: moment().startOf('day').toDate(),
      class: 'col-sm-6 col-md-4 col-lg-3 col-xl-2',
      reset: () => filterDef.currentValue = moment().startOf('day').toDate(),
    };
    // Set
    this.setFilterDef(filterDef);
  }
}
