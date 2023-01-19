import './arrays/prototype';

import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbDatepickerModule, NgbDropdownModule, NgbModalModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskModule } from 'ngx-mask';
import { TextareaAutosizeModule } from 'ngx-textarea-autosize';
import { ProjectDecisionCreateModalComponent } from 'src/app/shared/forms/project-decision-create-modal/project-decision-create-modal.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { PortalModule } from '@angular/cdk/portal';
import { CdkTableModule } from '@angular/cdk/table';
import { InterventionCardComponent } from '../interventions/intervention-card/intervention-card.component';
import { DrawAssetModalComponent } from '../interventions/intervention-form/intervention-creation/draw-asset-modal/draw-asset-modal.component';
import { AddressCardComponent } from '../map/cards/address-card/address-card.component';
import { BoroughCountCardComponent } from '../map/cards/borough-count-card/borough-count-card.component';
import { DeleteFavoriteModalComponent } from '../map/panel/filters/favorites/delete-favorite-modal/delete-favorite-modal.component';
import { SaveFavoriteModalComponent } from '../map/panel/filters/favorites/save-favorite-modal/save-favorite-modal.component';
import { LoadingBarComponent } from '../map/panel/loading-bar/loading-bar.component';
import { AddressPopupComponent } from '../map/popups/address-popup/address-popup.component';
import { AssetPopupComponent } from '../map/popups/asset-popup/asset-popup.component';
import { BoroughCountPopupComponent } from '../map/popups/borough-count-popup/borough-count-popup.component';
import { ClusterPopupComponent } from '../map/popups/cluster-popup/cluster-popup.component';
import { InterventionPopupComponent } from '../map/popups/intervention-popup/intervention-popup.component';
import { PopupLayoutComponent } from '../map/popups/popup-layout/popup-layout.component';
import { ProjectPopupComponent } from '../map/popups/project-popup/project-popup.component';
import { RtuProjectPopupComponent } from '../map/popups/rtu-project-popup/rtu-project-popup.component';
import { AssetCardComponent } from '../map/selection/cards/asset-card/asset-card.component';
import { ObjectivePreviewComponent } from '../program-book/program-book-objectives/objective-preview/objective-preview.component';
import { ProjectCardComponent } from '../projects/project-card/project-card.component';
import { RtuProjectCardComponent } from '../projects/rtu-project-card/rtu-project-card.component';
import { DecisionAcceptComponent } from '../window/decision-accept/decision-accept.component';
import { DecisionRefuseComponent } from '../window/decision-refuse/decision-refuse.component';
import { InterventionMoreInformationComponent } from '../window/intervention-more-information/intervention-more-information.component';
import { OpportunityNoticeNoteModalComponent } from '../window/opportunity-notices/opportunity-notices-note-modal/opportunity-notices-note-modal.component';
import { ProjectDecisionsComponent } from '../window/project-decisions/project-decisions.component';
import { ProjectMoreInformationComponent } from '../window/project-more-information/project-more-information.component';
import { SubmissionRequirementsModalComponent } from '../window/submission-window/submission-requirements/submission-requirements-modal/submission-requirements-modal.component';
import { AlertComponent } from './alerts/alert/alert.component';
import { AssetListComponent } from './components/asset-list/asset-list.component';
import { CollapseComponent } from './components/collapse/collapse.component';
import { ContextualMenuComponent } from './components/contextual-menu/contextual-menu.component';
import { DocumentStatusBadgeComponent } from './components/document-status-badge/document-status-badge.component';
import { InterventionListComponent } from './components/intervention-list/intervention-list.component';
import { LastRefreshComponent } from './components/manual-refresh/last-refresh/last-refresh.component';
import { ManualRefreshComponent } from './components/manual-refresh/manual-refresh/manual-refresh.component';
import { MapOverlayComponent } from './components/map-overlay/map-overlay.component';
import { MapboxPopupComponent } from './components/mapbox-popup/mapbox-popup.component';
import { MedalComponent } from './components/medal/medal.component';
import { MoreDetailsCollapseLabelComponent } from './components/more-details-collapse-label/more-details-collapse-label.component';
import { MoreInformationFieldComponent } from './components/more-information-field/more-information-field.component';
import { MoreOptionsButtonComponent } from './components/more-options-button/more-options-button.component';
import { MoreOptionsMenuItemComponent } from './components/more-options-menu-item/more-options-menu-item.component';
import { MultiSelectCheckboxComponent } from './components/multi-select-checkbox/multi-select-checkbox.component';
import { MultiSelectComponent } from './components/multi-select/multi-select.component';
import { NoResultPlaceholderComponent } from './components/no-result-placeholder/no-result-placeholder.component';
import { SubmissionNumberColumnComponent } from './components/portals/submission-number-column/submission-number-column.component';
import { ProgramBookProjectDetailComponent } from './components/program-book-project-detail/program-book-project-detail.component';
import { ProgressCircleComponent } from './components/progress-circle/progress-circle.component';
import { RadioInputComponent } from './components/radio-input/radio-input.component';
import { RequirementConflictualItemComponent } from './components/requirements/requirement-conflictual-item/requirement-conflictual-item.component';
import { RequirementListComponent } from './components/requirements/requirement-list/requirement-list.component';
import { RoadSectionActivityRowComponent } from './components/road-section-activity-row/road-section-activity-row.component';
import { RoadSectionActivityStatusComponent } from './components/road-section-activity-status/road-section-activity-status.component';
import { RoadSectionActivityComponent } from './components/road-section-activity/road-section-activity.component';
import { SpinnerCardComponent } from './components/spinner-card/spinner-card.component';
import { SpinnerOverlayComponent } from './components/spinner-overlay/spinner-overlay.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SubmissionLinkComponent } from './components/submission-link/submission-link.component';
import { SvgComponent } from './components/svg.component';
import { VdmSelectBadgeComponent } from './components/vdm-select-badge/vdm-select-badge.component';
import { VdmSelectComponent } from './components/vdm-select/vdm-select.component';
import { VdmTableComponent } from './components/vdm-table/vdm-table/vdm-table.component';
import { DetailsLayoutComponent } from './details-layout/details-layout/details-layout.component';
import { ListItemActionComponent } from './details-layout/list-item-action/list-item-action.component';
import { ListItemDetailsFieldComponent } from './details-layout/list-item-details-field/list-item-details-field.component';
import { ListItemDetailsComponent } from './details-layout/list-item-details/list-item-details.component';
import { ListItemComponent } from './details-layout/list-item/list-item.component';
import { NoResultComponent } from './details-layout/no-result/no-result.component';
import { AddProjectPriorityServiceModalComponent } from './dialogs/add-project-priority-service-modal/add-project-priority-service-modal.component';
import { BasicModalComponent } from './dialogs/basic-modal/basic-modal.component';
import { ChangeRankModalModalComponent } from './dialogs/change-rank-modal/change-rank-modal.component';
import { ConsultSequencingNotesModalComponent } from './dialogs/consult-sequencing-notes-modal/consult-sequencing-notes-modal.component';
import { CustomizeInterventionFilterViewModalComponent } from './dialogs/customize-intervention-filter-view-modal/customize-intervention-filter-view-modal';
import { CustomizeInterventionTableViewModalComponent } from './dialogs/customize-intervention-table-view-modal/customize-intervention-table-view-modal.component';
import { CustomizeProgramBookTableViewModalComponent } from './dialogs/customize-program-book-table-view-modal/customize-program-book-table-view-modal.component';
import { CustomizeProjectFilterViewComponent } from './dialogs/customize-project-filter-view/customize-project-filter-view.component';
import { ErrorModalComponent } from './dialogs/error-modal/error-modal.component';
import { ExportInterventionsModalComponent } from './dialogs/export-modal/export-interventions-modal/export-interventions-modal.component';
import { ExportProjectsModalComponent } from './dialogs/export-modal/export-projects-modal/export-projects-modal.component';
import { LayoutModalComponent } from './dialogs/form-modal/layout-modal.component';
import { ObjectiveModalComponent } from './dialogs/objective-modal/objective-modal.component';
import { OpportunityNoticeModalComponent } from './dialogs/opportunity-notice-modal/opportunity-notice-modal.component';
import { PriorityLevelSortCriteriaComponent } from './dialogs/priority-level-sort-modal/priority-level-sort-criteria/priority-level-sort-criteria.component';
import { PriorityLevelSortModalComponent } from './dialogs/priority-level-sort-modal/priority-level-sort-modal.component';
import { TextModalComponent } from './dialogs/text-modal/text-modal.component';
import { DragDropFileDirective } from './directives/drag-drop-file.directive';
import { IntegerInputDirective } from './directives/integer-input.directive';
import { MapHighlightHoverDirective } from './directives/map-select-hover.directive';
import { OutsideClickDirective } from './directives/outside-click.directive';
import { SortDirective } from './directives/sort.directive';
import { StopPropagationDirective } from './directives/stop-propagation.directive';
import { TooltipOpenDelayDirective } from './directives/tooltip-open-delay.directive';
import { TrimDirective } from './directives/trim.directive';
import { WindowAppLinkDirective } from './directives/window-app-link.directive';
import { AlertModalComponent } from './forms/alert-modal/alert-modal.component';
import { UpdateAnnualBudgetModalComponent } from './forms/annual-distribution/update-annual-budget-modal/update-annual-budget-modal.component';
import { UpdateInterventionAnnualDistributionModalComponent } from './forms/annual-distribution/update-intervention-annual-distribution-modal/update-intervention-annual-distribution-modal.component';
import { UpdateProjectAdditionalCostsComponent } from './forms/annual-distribution/update-project-additional-costs/update-project-additional-costs.component';
import { CheckboxComponent } from './forms/checkbox/checkbox.component';
import { InterventionCommentCreateComponent } from './forms/comments/comment-create/intervention-comment-create.component';
import { ProjectCommentCreateComponent } from './forms/comments/comment-create/project-comment-create.component';
import { CommentFormLayoutComponent } from './forms/comments/comment-form-layout/comment-form-layout.component';
import { InterventionCommentUpdateComponent } from './forms/comments/comment-update/intervention-comment-update.component';
import { ProjectCommentUpdateComponent } from './forms/comments/comment-update/project-comment-update.component';
import { ConfirmationModalComponent } from './forms/confirmation-modal/confirmation-modal.component';
import { DecisionCancelComponent } from './forms/decision/decision-cancel/decision-cancel.component';
import { DecisionRevisionComponent } from './forms/decision/decision-revision/decision-revision.component';
import { InterventionDecisionCreateComponent } from './forms/decision/intervention-decision-create.component';
import { DetailsAddButtonComponent } from './forms/details-add-button/details-add-button.component';
import { DetailsEditButtonComponent } from './forms/details-edit-button/details-edit-button.component';
import { DocumentModalComponent } from './forms/documents/document-modal/document-modal.component';
import { EmptyPlaceholderDirective } from './forms/empty-placeholder/empty-placeholder.directive';
import { FormErrorClassDirective } from './forms/errors/form-error-class.directive';
import { FormErrorStructuralDirective } from './forms/errors/form-error-structural.directive';
import { FormErrorTagDirective } from './forms/errors/form-error-tag.directive';
import { FormErrorsComponent } from './forms/errors/form-errors.component';
import { FileComponent } from './forms/file/file.component';
import { InputFloatComponent } from './forms/input-float/input-float.component';
import { InterventionRequirementCreateModalComponent } from './forms/intervention-requirement-create-modal/intervention-requirement-create-modal.component';
import { MenuActiveComponent } from './forms/menu-active/menu-active.component';
import { ProjectRequirementCreateModalComponent } from './forms/project-requirement-create-modal/project-requirement-create-modal.component';
import { RequirementCreateComponent } from './forms/requirements-create/requirement-create.component';
import { SelectCheckboxComponent } from './forms/select-checkbox/select-checkbox.component';
import { SliderComponent } from './forms/slider/slider.component';
import { SortComponent } from './forms/sort/sort.component';
import { ToggleButtonComponent } from './forms/toggle-button/toggle-button.component';
import { ToolboxFileComponent } from './forms/toolbox-file/toolbox-file.component';
import { UnidirectionalSortComponent } from './forms/unidirectional-sort/unidirectional-sort.component';
import { GanttBarComponent } from './gantt/gantt-bar/gantt-bar.component';
import { GanttCellComponent } from './gantt/gantt-cell/gantt-cell.component';
import { GanttRowDetailComponent } from './gantt/gantt-row-detail/gantt-row-detail.component';
import { GanttRowOptionsComponent } from './gantt/gantt-row-options/gantt-row-options.component';
import { GanttRowComponent } from './gantt/gantt-row/gantt-row.component';
import { GanttComponent } from './gantt/gantt.component';
import { CaptureClickDirective } from './html/capture-click/capture-click';
import { TableColumnHeaderComponent } from './layouts/table-column-header/table-column-header.component';
import { TableColumnItemComponent } from './layouts/table-column-item/table-column-item.component';
import { NotificationComponent } from './notification/notification.component';
import { AddUnitsPipe } from './pipes/add-units.pipe';
import { AuditByPipe } from './pipes/audit-by.pipe';
import { AuditDateTimePipe } from './pipes/audit-date-time.pipe';
import { CurrencyKPipe } from './pipes/currencyk.pipe';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { DrmSubmissionNumberFormatPipe } from './pipes/drm-submission-number-format.pipe';
import { ExternalReferencePipe } from './pipes/external-reference.pipe';
import { FilterPipe } from './pipes/filter.pipe';
import { IconClassNameByAssetType } from './pipes/icon-class-by-asset-type.pipe';
import { InterventionColorPipe } from './pipes/intervention-color.pipe';
import { IsIncludedPipe } from './pipes/is-included.pipe';
import { JoinAllBoroughsPipe } from './pipes/join-all-boroughs.pipe';
import { JoinPipe } from './pipes/join.pipe';
import { MetersToKilometersPipe } from './pipes/metersToKilometers.pipe';
import { NexoLogBadge } from './pipes/nexo-log-badge.pipe';
import { NotAvailablePipe } from './pipes/not-available.pipe';
import { NumberPipe } from './pipes/number.pipe';
import { ObjectiveProgressLabelPipe } from './pipes/objective-progress-label.pipe';
import { ObjectiveProgressPipe } from './pipes/objective-progress.pipe';
import { OrderByPipe } from './pipes/order-by.pipe';
import { PadPipe } from './pipes/pad.pipe';
import { PartnerCategoryPipe } from './pipes/partner-category.pipe';
import { PermissionsPipe } from './pipes/permissions.pipe';
import { ProjectColorPipe } from './pipes/project-color.pipe';
import { ProjectTypeBadgePipe } from './pipes/project-type-badge.pipe';
import { ProjectCategoriesPipe } from './pipes/projectCategories.pipe';
import { RtuProjectColorPipe } from './pipes/rtu-project-color.pipe';
import { TaxonomyPipe } from './pipes/taxonomies.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';
import { UserRestrictionsPipe } from './pipes/user-restrictions.pipe';
import { SearchBoxComponent } from './search-box/search-box.component';

/**
 * Ng module that contains shared components.
 * Need this module in order to import common functionalities in lazy loaded feature modules.
 */
@NgModule({
  declarations: [
    AddProjectPriorityServiceModalComponent,
    AddressCardComponent,
    AddressPopupComponent,
    AddUnitsPipe,
    AlertComponent,
    AlertModalComponent,
    AssetCardComponent,
    AssetListComponent,
    AssetPopupComponent,
    AuditByPipe,
    AuditDateTimePipe,
    BasicModalComponent,
    BoroughCountCardComponent,
    BoroughCountPopupComponent,
    CaptureClickDirective,
    ChangeRankModalModalComponent,
    CheckboxComponent,
    ClusterPopupComponent,
    CollapseComponent,
    CommentFormLayoutComponent,
    ConfirmationModalComponent,
    ConsultSequencingNotesModalComponent,
    ContextualMenuComponent,
    CurrencyKPipe,
    CustomizeProgramBookTableViewModalComponent,
    CustomizeInterventionTableViewModalComponent,
    CustomizeInterventionFilterViewModalComponent,
    DateFormatPipe,
    DecisionAcceptComponent,
    DecisionCancelComponent,
    DecisionRefuseComponent,
    DecisionRevisionComponent,
    DecisionRevisionComponent,
    DeleteFavoriteModalComponent,
    DetailsAddButtonComponent,
    DetailsEditButtonComponent,
    DetailsLayoutComponent,
    DocumentModalComponent,
    DocumentStatusBadgeComponent,
    DragDropFileDirective,
    DrawAssetModalComponent,
    DrmSubmissionNumberFormatPipe,
    EmptyPlaceholderDirective,
    ErrorModalComponent,
    ExportInterventionsModalComponent,
    ExportProjectsModalComponent,
    ExternalReferencePipe,
    FileComponent,
    FilterPipe,
    FormErrorClassDirective,
    FormErrorsComponent,
    FormErrorStructuralDirective,
    FormErrorTagDirective,
    GanttBarComponent,
    GanttCellComponent,
    GanttComponent,
    GanttRowComponent,
    GanttRowDetailComponent,
    GanttRowOptionsComponent,
    IconClassNameByAssetType,
    InputFloatComponent,
    IntegerInputDirective,
    InterventionCardComponent,
    InterventionColorPipe,
    InterventionCommentCreateComponent,
    InterventionCommentUpdateComponent,
    InterventionDecisionCreateComponent,
    InterventionListComponent,
    InterventionMoreInformationComponent,
    InterventionPopupComponent,
    InterventionRequirementCreateModalComponent,
    IsIncludedPipe,
    JoinAllBoroughsPipe,
    JoinPipe,
    LastRefreshComponent,
    LayoutModalComponent,
    ListItemActionComponent,
    ListItemComponent,
    ListItemDetailsComponent,
    ListItemDetailsFieldComponent,
    LoadingBarComponent,
    ManualRefreshComponent,
    MapOverlayComponent,
    MapboxPopupComponent,
    MapHighlightHoverDirective,
    MedalComponent,
    MenuActiveComponent,
    MetersToKilometersPipe,
    MoreDetailsCollapseLabelComponent,
    MoreInformationFieldComponent,
    MoreOptionsButtonComponent,
    MoreOptionsMenuItemComponent,
    MultiSelectCheckboxComponent,
    MultiSelectComponent,
    NexoLogBadge,
    NoResultComponent,
    NoResultPlaceholderComponent,
    NotAvailablePipe,
    NotificationComponent,
    NumberPipe,
    ObjectiveModalComponent,
    ObjectiveProgressLabelPipe,
    ObjectiveProgressPipe,
    OpportunityNoticeModalComponent,
    OpportunityNoticeNoteModalComponent,
    OrderByPipe,
    OutsideClickDirective,
    PadPipe,
    PartnerCategoryPipe,
    PermissionsPipe,
    UserRestrictionsPipe,
    PopupLayoutComponent,
    PriorityLevelSortCriteriaComponent,
    PriorityLevelSortModalComponent,
    PriorityLevelSortModalComponent,
    ProgramBookProjectDetailComponent,
    ProgressCircleComponent,
    ProjectCardComponent,
    ProjectCategoriesPipe,
    ProjectColorPipe,
    ProjectCommentCreateComponent,
    ProjectCommentUpdateComponent,
    ProjectDecisionCreateModalComponent,
    ProjectDecisionsComponent,
    ProjectMoreInformationComponent,
    ProjectPopupComponent,
    ProjectRequirementCreateModalComponent,
    ProjectTypeBadgePipe,
    RadioInputComponent,
    RequirementConflictualItemComponent,
    RequirementCreateComponent,
    RequirementListComponent,
    RoadSectionActivityComponent,
    RoadSectionActivityRowComponent,
    RoadSectionActivityStatusComponent,
    RtuProjectCardComponent,
    RtuProjectColorPipe,
    RtuProjectPopupComponent,
    SaveFavoriteModalComponent,
    SearchBoxComponent,
    SelectCheckboxComponent,
    SliderComponent,
    SortComponent,
    SortDirective,
    SpinnerCardComponent,
    SpinnerComponent,
    StopPropagationDirective,
    SubmissionLinkComponent,
    SubmissionNumberColumnComponent,
    SvgComponent,
    TableColumnHeaderComponent,
    TableColumnItemComponent,
    TaxonomyPipe,
    TextModalComponent,
    ToggleButtonComponent,
    ToolboxFileComponent,
    TooltipOpenDelayDirective,
    TrimDirective,
    TruncatePipe,
    UnidirectionalSortComponent,
    UpdateAnnualBudgetModalComponent,
    UpdateInterventionAnnualDistributionModalComponent,
    UpdateProjectAdditionalCostsComponent,
    VdmSelectComponent,
    WindowAppLinkDirective,
    ObjectivePreviewComponent,
    VdmSelectBadgeComponent,
    VdmTableComponent,
    SubmissionRequirementsModalComponent,
    CustomizeProjectFilterViewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    NgbDropdownModule,
    NgbModalModule,
    NgbModule,
    NgSelectModule,
    CdkTableModule,
    NgxMaskModule.forChild(),
    PortalModule,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
    TextareaAutosizeModule
  ],
  exports: [
    VdmTableComponent,
    AddProjectPriorityServiceModalComponent,
    AddressCardComponent,
    AddressPopupComponent,
    AddUnitsPipe,
    AlertComponent,
    AlertModalComponent,
    AssetCardComponent,
    AssetListComponent,
    AssetPopupComponent,
    AuditByPipe,
    AuditDateTimePipe,
    BoroughCountCardComponent,
    BoroughCountPopupComponent,
    CaptureClickDirective,
    ChangeRankModalModalComponent,
    CheckboxComponent,
    ClusterPopupComponent,
    CollapseComponent,
    CommentFormLayoutComponent,
    ConfirmationModalComponent,
    ConsultSequencingNotesModalComponent,
    ContextualMenuComponent,
    CurrencyKPipe,
    CustomizeProgramBookTableViewModalComponent,
    CustomizeInterventionTableViewModalComponent,
    CustomizeInterventionFilterViewModalComponent,
    CustomizeProjectFilterViewComponent,
    DateFormatPipe,
    DecisionAcceptComponent,
    DecisionCancelComponent,
    DecisionRefuseComponent,
    DecisionRevisionComponent,
    DeleteFavoriteModalComponent,
    DetailsAddButtonComponent,
    DetailsEditButtonComponent,
    DetailsLayoutComponent,
    DocumentModalComponent,
    DocumentStatusBadgeComponent,
    DragDropFileDirective,
    DrawAssetModalComponent,
    DrmSubmissionNumberFormatPipe,
    EmptyPlaceholderDirective,
    ErrorModalComponent,
    ExportInterventionsModalComponent,
    ExportProjectsModalComponent,
    ExternalReferencePipe,
    FileComponent,
    FilterPipe,
    FormErrorClassDirective,
    FormErrorsComponent,
    FormErrorStructuralDirective,
    FormErrorTagDirective,
    GanttBarComponent,
    GanttCellComponent,
    GanttComponent,
    GanttRowComponent,
    GanttRowDetailComponent,
    GanttRowOptionsComponent,
    IconClassNameByAssetType,
    InputFloatComponent,
    IntegerInputDirective,
    InterventionCardComponent,
    InterventionColorPipe,
    InterventionCommentCreateComponent,
    InterventionDecisionCreateComponent,
    InterventionListComponent,
    InterventionMoreInformationComponent,
    InterventionPopupComponent,
    InterventionRequirementCreateModalComponent,
    IsIncludedPipe,
    JoinAllBoroughsPipe,
    JoinPipe,
    LayoutModalComponent,
    ListItemActionComponent,
    ListItemComponent,
    ListItemDetailsComponent,
    ListItemDetailsFieldComponent,
    LoadingBarComponent,
    MapHighlightHoverDirective,
    MapOverlayComponent,
    MedalComponent,
    MenuActiveComponent,
    MetersToKilometersPipe,
    MoreDetailsCollapseLabelComponent,
    MoreInformationFieldComponent,
    MoreOptionsButtonComponent,
    MoreOptionsMenuItemComponent,
    MultiSelectCheckboxComponent,
    MultiSelectComponent,
    NexoLogBadge,
    NoResultComponent,
    NoResultPlaceholderComponent,
    NotAvailablePipe,
    NotificationComponent,
    NumberPipe,
    ObjectiveModalComponent,
    ObjectiveProgressLabelPipe,
    ObjectiveProgressPipe,
    OpportunityNoticeModalComponent,
    OrderByPipe,
    OutsideClickDirective,
    PadPipe,
    PartnerCategoryPipe,
    PermissionsPipe,
    UserRestrictionsPipe,
    PriorityLevelSortCriteriaComponent,
    PriorityLevelSortModalComponent,
    ProgramBookProjectDetailComponent,
    ProgressCircleComponent,
    ProjectCardComponent,
    ProjectCategoriesPipe,
    ProjectCommentCreateComponent,
    ProjectDecisionCreateModalComponent,
    ProjectDecisionsComponent,
    ProjectMoreInformationComponent,
    ProjectRequirementCreateModalComponent,
    ProjectTypeBadgePipe,
    RadioInputComponent,
    ReactiveFormsModule,
    RequirementListComponent,
    RoadSectionActivityComponent,
    RoadSectionActivityRowComponent,
    RoadSectionActivityStatusComponent,
    RtuProjectCardComponent,
    SaveFavoriteModalComponent,
    SearchBoxComponent,
    SelectCheckboxComponent,
    SliderComponent,
    SortComponent,
    SortDirective,
    SpinnerCardComponent,
    SpinnerComponent,
    StopPropagationDirective,
    SubmissionLinkComponent,
    SubmissionNumberColumnComponent,
    SvgComponent,
    TableColumnHeaderComponent,
    TableColumnItemComponent,
    TaxonomyPipe,
    TextModalComponent,
    ToggleButtonComponent,
    ToolboxFileComponent,
    TooltipOpenDelayDirective,
    TrimDirective,
    TruncatePipe,
    UnidirectionalSortComponent,
    UpdateAnnualBudgetModalComponent,
    UpdateInterventionAnnualDistributionModalComponent,
    UpdateProjectAdditionalCostsComponent,
    VdmSelectComponent,
    WindowAppLinkDirective,
    ObjectivePreviewComponent,
    VdmSelectBadgeComponent,
    SubmissionRequirementsModalComponent
  ],
  providers: [DatePipe, DrmSubmissionNumberFormatPipe],
  entryComponents: [
    AddProjectPriorityServiceModalComponent,
    AddressPopupComponent,
    AlertModalComponent,
    AssetPopupComponent,
    BasicModalComponent,
    BoroughCountPopupComponent,
    ChangeRankModalModalComponent,
    ClusterPopupComponent,
    ConfirmationModalComponent,
    ConfirmationModalComponent,
    ConsultSequencingNotesModalComponent,
    CustomizeProgramBookTableViewModalComponent,
    CustomizeInterventionTableViewModalComponent,
    CustomizeInterventionFilterViewModalComponent,
    CustomizeProjectFilterViewComponent,
    DecisionAcceptComponent,
    DecisionRefuseComponent,
    DecisionRevisionComponent,
    DeleteFavoriteModalComponent,
    DocumentModalComponent,
    ErrorModalComponent,
    ExportInterventionsModalComponent,
    ExportProjectsModalComponent,
    InterventionCommentCreateComponent,
    InterventionCommentUpdateComponent,
    InterventionDecisionCreateComponent,
    InterventionMoreInformationComponent,
    InterventionPopupComponent,
    InterventionRequirementCreateModalComponent,
    LastRefreshComponent,
    LayoutModalComponent,
    ManualRefreshComponent,
    MapboxPopupComponent,
    MedalComponent,
    ObjectiveModalComponent,
    OpportunityNoticeModalComponent,
    OpportunityNoticeNoteModalComponent,
    PriorityLevelSortModalComponent,
    ProjectCommentCreateComponent,
    ProjectCommentUpdateComponent,
    ProjectDecisionCreateModalComponent,
    ProjectMoreInformationComponent,
    ProjectPopupComponent,
    ProjectRequirementCreateModalComponent,
    RtuProjectPopupComponent,
    SaveFavoriteModalComponent,
    SubmissionNumberColumnComponent,
    TextModalComponent,
    UnidirectionalSortComponent,
    UpdateAnnualBudgetModalComponent,
    UpdateInterventionAnnualDistributionModalComponent,
    UpdateProjectAdditionalCostsComponent,
    SubmissionRequirementsModalComponent
  ]
})
export class SharedModule {}
