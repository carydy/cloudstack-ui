import { Injectable } from '@angular/core';
import { ServiceOfferingFilterService, Utils } from '../../shared/services';
import { VmCreationData } from './data/vm-creation-data';
import { VmCreationState } from './data/vm-creation-state';
import { VmCreationField, VmCreationFields } from './vm-creation-fields';
import { VmCreationFormState } from './vm-creation.component';
import cloneDeep = require('lodash/cloneDeep');


@Injectable()
export class VmCreationFormNormalizationService {
  constructor(private serviceOfferingFilterService: ServiceOfferingFilterService) {}

  public normalize(formState: VmCreationFormState, changedField?: VmCreationField): VmCreationFormState {
    const modifiedState = this.clone(formState);
    if (!changedField) {
      return this.filterZones(modifiedState);
    }

    switch (changedField) {
      case VmCreationFields.zone:
        return this.getStateFromZone(modifiedState);

      case VmCreationFields.template:
        return this.getStateFromTemplate(modifiedState);

      case VmCreationFields.diskOffering:
        return this.getStateFromDiskOffering(modifiedState);

      default:
        return modifiedState;
    }
  }

  private clone(formState: VmCreationFormState): VmCreationFormState {
    const modifiedState = Object.assign({}, formState);
    const data = Object.assign({}, formState.data);
    const state = Object.assign({}, formState.state);
    modifiedState.data = data;
    modifiedState.state = state;
    Object.setPrototypeOf(modifiedState.data, VmCreationData.prototype);
    Object.setPrototypeOf(modifiedState.state, VmCreationState.prototype);
    return modifiedState;
  }

  private filterZones(formState: VmCreationFormState): VmCreationFormState {
    return this.getStateFromZone(formState);
  }

  private getStateFromZone(formState: VmCreationFormState): VmCreationFormState {
    const modifiedFormState = this.filterServiceOfferings(formState);
    return this.filterTemplates(modifiedFormState);
  }

  private filterServiceOfferings(formState: VmCreationFormState): VmCreationFormState {
    formState.data.serviceOfferings = this.serviceOfferingFilterService
      .getAvailableByResourcesSync(
        formState.data.serviceOfferings,
        formState.data.configurationData.offeringAvailability,
        formState.data.configurationData.customOfferingRestrictions,
        formState.data.resourceUsage,
        formState.state.zone
      );

    const offeringStillAvailable = !!formState
      .data.serviceOfferings.find(offering => {
        return formState.state.serviceOffering.id === offering.id;
      });

    if (!offeringStillAvailable) {
      formState.state.serviceOffering = formState.data.serviceOfferings[0];
    }

    return formState;
  }

  private filterTemplates(formState: VmCreationFormState): VmCreationFormState {
    const filteredTemplates = formState.data.templates.filter(template => {
      return template.sizeInGB < formState.data.rootDiskSizeLimit;
    });

    const filteredIsos = formState.data.isos.filter(iso => {
      return iso.sizeInGB < formState.data.rootDiskSizeLimit;
    });

    formState.data.templates = filteredTemplates;
    formState.data.isos  = filteredIsos;

    const templateStillAvailable = !!formState
      .data.installationSources.find(template => {
        return formState.state.template.id === template.id;
      });

    if (!templateStillAvailable) {
      formState.state.template = formState.data.defaultTemplate;
    }
    return this.getStateFromTemplate(formState);
  }

  private getStateFromTemplate(formState: VmCreationFormState): VmCreationFormState {
    return this.filterDiskOfferings(formState);
  }

  private filterDiskOfferings(formState: VmCreationFormState): VmCreationFormState {
    if (formState.state.diskOfferingsAreAllowed) {
      formState.data.diskOfferings = formState.data.diskOfferings.filter(diskOffering => {
        const selectedTemplateFits = diskOffering.diskSize > formState.state.template.sizeInGB;
        const diskOfferingFits = diskOffering.diskSize < formState.data.rootDiskSizeLimit;
        return selectedTemplateFits && diskOfferingFits;
      });
    }

    const diskOfferingStillAvailable = !!formState
      .data.diskOfferings.find(offering => {
        return formState.state.diskOffering.id === offering.id;
      });

    if (!diskOfferingStillAvailable) {
      formState.state.diskOffering = formState.data.diskOfferings[0];
    }
    return this.getStateFromDiskOffering(formState);
  }

  private getStateFromDiskOffering(formState: VmCreationFormState): VmCreationFormState {
    return this.filterDiskSize(formState);
  }

  private filterDiskSize(formState: VmCreationFormState): VmCreationFormState {
    const modifiedFormState = Object.assign({}, formState);

    if (!formState.state.showRootDiskResize) { return formState; }

    const newSize = formState.state.template.size ? Utils.convertToGB(formState.state.template.size) : 1;
    modifiedFormState.state.rootDiskSize = newSize;
    modifiedFormState.state.rootDiskSizeMin = newSize;

    return modifiedFormState;
  }
}
