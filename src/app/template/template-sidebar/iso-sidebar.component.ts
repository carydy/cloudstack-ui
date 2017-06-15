import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ListService } from '../../shared/components/list/list.service';
import { IsoService } from '../shared';
import { TemplateActionsService } from '../shared/template-actions.service';
import { BaseTemplateSidebarComponent } from './base-template-sidebar.component';

@Component({
  selector: 'cs-iso-sidebar',
  templateUrl: './base-template-sidebar.component.html',
  styleUrls: ['./base-template-sidebar.component.scss']
})
export class IsoSidebarComponent extends BaseTemplateSidebarComponent {
  constructor(
    isoService: IsoService,
    route: ActivatedRoute,
    templateActions: TemplateActionsService,
    listService: ListService
  ) {
    super(isoService, templateActions, listService, route);
  }
}
