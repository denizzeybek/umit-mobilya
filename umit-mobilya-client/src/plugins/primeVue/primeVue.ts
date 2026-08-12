import { type App } from 'vue';

import Breadcrumb from 'primevue/breadcrumb';
import Card from 'primevue/card';
import Carousel from 'primevue/carousel';
import Chart from 'primevue/chart';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import PrimeVue from 'primevue/config';
import DataTable from 'primevue/datatable';
import DataView from 'primevue/dataview';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Drawer from 'primevue/drawer';
import FileUpload from 'primevue/fileupload';
import Galleria from 'primevue/galleria';
import InputNumber from 'primevue/inputnumber';
import Menu from 'primevue/menu';
import Message from 'primevue/message';
import MultiSelect from 'primevue/multiselect';
import Panel from 'primevue/panel';
import Password from 'primevue/password';
import PickList from 'primevue/picklist';
import Rating from 'primevue/rating';
import Ripple from 'primevue/ripple';
import Row from 'primevue/row';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Skeleton from 'primevue/skeleton';
import Slider from 'primevue/slider';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Step from 'primevue/step';
import StepItem from 'primevue/stepitem';
import StepList from 'primevue/steplist';
import StepPanel from 'primevue/steppanel';
import StepPanels from 'primevue/steppanels';
import Stepper from 'primevue/stepper';
// import Aura from '@primevue/themes/aura';
import StyleClass from 'primevue/styleclass';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import Tag from 'primevue/tag';
import ToastService from 'primevue/toastservice';
import ToggleSwitch from 'primevue/toggleswitch';
import Toolbar from 'primevue/toolbar';
import Tooltip from 'primevue/tooltip';
import TreeTable from 'primevue/treetable'

import { flexyPreset } from './flexytheme';

import 'primeicons/primeicons.css';


export default {
  install(app: App) {
    app.use(PrimeVue, {
      theme: {
        preset: flexyPreset,
        // preset: Aura,
        options: {
          darkModeSelector: '.my-app-dark',
        },
      },
    });
    app.use(ToastService);

    app.component('Galleria', Galleria);
    app.component('Splitter', Splitter);
    app.component('SplitterPanel', SplitterPanel);
    app.component('PickList', PickList);
    app.component('DataView', DataView);
    app.component('Toolbar', Toolbar);
    app.component('Carousel', Carousel);
    app.component('Chart', Chart);
    app.component('StepPanel', StepPanel);
    app.component('Step', Step);
    app.component('StepItem', StepItem);
    app.component('StepPanels', StepPanels);
    app.component('StepList', StepList);
    app.component('Stepper', Stepper);
    app.component('SelectButton', SelectButton);
    app.component('Slider', Slider);
    app.component('InputNumber', InputNumber);
    app.component('ToggleSwitch', ToggleSwitch);
    app.component('DatePicker', DatePicker);
    app.component('Skeleton', Skeleton);
    app.component('Divider', Divider);
    app.component('FileUpload', FileUpload);
    app.component('Dialog', Dialog);
    app.component('TreeTable', TreeTable);
    app.component('DatePicker', DatePicker);
    app.component('Breadcrumb', Breadcrumb);
    app.component('Message', Message);
    app.component('Menu', Menu);
    app.component('Drawer', Drawer);
    app.component('Select', Select);
    app.component('MultiSelect', MultiSelect);
    app.component('Tabs', Tabs);
    app.component('TabList', TabList);
    app.component('Tab', Tab);
    app.component('TabPanels', TabPanels);
    app.component('TabPanel', TabPanel);
    app.component('Panel', Panel);
    app.component('DataTable', DataTable);
    app.component('Column', Column);
    app.component('ColumnGroup', ColumnGroup);
    app.component('Row', Row);
    app.component('Rating', Rating);
    app.component('Tag', Tag);
    app.component('Card', Card);
    app.component('Checkbox', Checkbox);
    app.component('Password', Password);

    app.directive('styleclass', StyleClass);
    app.directive('ripple', Ripple);
    app.directive('tooltip', Tooltip);
  },
};
