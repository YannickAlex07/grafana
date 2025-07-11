import { css } from '@emotion/css';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { uniqueId } from 'lodash';
import { useEffect, useState } from 'react';

import { GrafanaTheme2, MappingType, SelectableValue, SpecialValueMatch, ValueMapping } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { useStyles2, Modal, ValuePicker, Button } from '@grafana/ui';

import { ValueMappingEditRow, ValueMappingEditRowModel } from './ValueMappingEditRow';

export interface Props {
  value: ValueMapping[];
  onChange: (valueMappings: ValueMapping[]) => void;
  onClose: () => void;
  showIconPicker?: boolean;
}

export function ValueMappingsEditorModal({ value, onChange, onClose, showIconPicker }: Props) {
  const styles = useStyles2(getStyles);
  const [rows, updateRows] = useState<ValueMappingEditRowModel[]>([]);

  useEffect(() => {
    updateRows(buildEditRowModels(value));
  }, [value]);

  const onDragEnd = (result: DropResult) => {
    if (!value || !result.destination) {
      return;
    }

    const copy = [...rows];
    const element = copy[result.source.index];
    copy.splice(result.source.index, 1);
    copy.splice(result.destination.index, 0, element);
    updateRows(copy);
  };

  const onChangeMapping = (index: number, row: ValueMappingEditRowModel) => {
    const newList = [...rows];
    newList.splice(index, 1, row);
    updateRows(newList);
  };

  const onRemoveRow = (index: number) => {
    const newList = [...rows];
    newList.splice(index, 1);
    updateRows(newList);
  };

  const mappingTypes: Array<SelectableValue<MappingType>> = [
    {
      label: t('dimensions.value-mappings-editor-modal.mapping-types.label.value', 'Value'),
      value: MappingType.ValueToText,
      description: t(
        'dimensions.value-mappings-editor-modal.mapping-types.description.match-a-specific-text-value',
        'Match a specific text value'
      ),
    },
    {
      label: t('dimensions.value-mappings-editor-modal.mapping-types.label.range', 'Range'),
      value: MappingType.RangeToText,
      description: t(
        'dimensions.value-mappings-editor-modal.mapping-types.description.match-a-numerical-range-of-values',
        'Match a numerical range of values'
      ),
    },
    {
      label: t('dimensions.value-mappings-editor-modal.mapping-types.label.regex', 'Regex'),
      value: MappingType.RegexToText,
      description: t(
        'dimensions.value-mappings-editor-modal.mapping-types.description.match-a-regular-expression-with-replacement',
        'Match a regular expression with replacement'
      ),
    },
    {
      label: t('dimensions.value-mappings-editor-modal.mapping-types.label.special', 'Special'),
      value: MappingType.SpecialValue,
      description: t(
        'dimensions.value-mappings-editor-modal.mapping-types.description.match-boolean-empty-values',
        'Match on null, NaN, boolean and empty values'
      ),
    },
  ];

  const onAddValueMapping = (value: SelectableValue<MappingType>) => {
    updateRows([...rows, createRow({ type: value.value!, result: {}, isNew: true })]);
  };

  const onDuplicateMapping = (index: number) => {
    const sourceRow = duplicateRow(rows[index]);
    const copy = [...rows];
    copy.splice(index, 0, { ...sourceRow });

    for (let i = index; i < rows.length; i++) {
      copy[i].result.index = i;
    }

    updateRows(copy);
  };

  const onUpdate = () => {
    onChange(editModelToSaveModel(rows));
    onClose();
  };

  // Start with an empty row
  useEffect(() => {
    if (!value?.length) {
      onAddValueMapping({ value: MappingType.ValueToText });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.editTable}>
          <thead>
            <tr>
              <th style={{ width: '1%' }}></th>
              <th style={{ width: '40%', textAlign: 'left' }} colSpan={2}>
                <Trans i18nKey="dimensions.value-mappings-editor-modal.condition">Condition</Trans>
              </th>
              <th style={{ textAlign: 'left' }}>
                <Trans i18nKey="dimensions.value-mappings-editor-modal.display-text">Display text</Trans>
              </th>
              <th style={{ width: '10%' }}>
                <Trans i18nKey="dimensions.value-mappings-editor-modal.color">Color</Trans>
              </th>
              {showIconPicker && (
                <th style={{ width: '10%' }}>
                  <Trans i18nKey="dimensions.value-mappings-editor-modal.icon">Icon</Trans>
                </th>
              )}
              <th style={{ width: '1%' }}></th>
            </tr>
          </thead>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sortable-field-mappings" direction="vertical">
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {rows.map((row, index) => (
                    <ValueMappingEditRow
                      key={row.id}
                      mapping={row}
                      index={index}
                      onChange={onChangeMapping}
                      onRemove={onRemoveRow}
                      onDuplicate={onDuplicateMapping}
                      showIconPicker={showIconPicker}
                    />
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </DragDropContext>
        </table>
      </div>

      <Modal.ButtonRow
        leftItems={
          <ValuePicker
            label={t('dimensions.value-mappings-editor-modal.label-add-a-new-mapping', 'Add a new mapping')}
            variant="secondary"
            size="md"
            icon="plus"
            menuPlacement="auto"
            minWidth={40}
            options={mappingTypes}
            onChange={onAddValueMapping}
          />
        }
      >
        <Button variant="secondary" fill="outline" onClick={onClose}>
          <Trans i18nKey="dimensions.value-mappings-editor-modal.cancel">Cancel</Trans>
        </Button>
        <Button variant="primary" onClick={onUpdate}>
          <Trans i18nKey="dimensions.value-mappings-editor-modal.update">Update</Trans>
        </Button>
      </Modal.ButtonRow>
    </>
  );
}

export const getStyles = (theme: GrafanaTheme2) => ({
  tableWrap: css({
    maxHeight: 'calc(80vh - 170px)',
    minHeight: '40px',
    overflow: 'auto',
  }),

  editTable: css({
    width: '100%',
    marginBottom: theme.spacing(2),

    'thead th': {
      textAlign: 'center',
    },

    'tbody tr:hover': {
      background: theme.colors.action.hover,
    },

    ' th, td': {
      padding: theme.spacing(1),
    },
  }),
});

function getRowUniqueId(): string {
  return uniqueId('mapping-');
}

function createRow(row: Partial<ValueMappingEditRowModel>): ValueMappingEditRowModel {
  return {
    type: MappingType.ValueToText,
    result: {},
    id: getRowUniqueId(),
    ...row,
  };
}

function duplicateRow(row: Partial<ValueMappingEditRowModel>): ValueMappingEditRowModel {
  return {
    ...createRow(row),
    // provide a new unique id to the duplicated row, to preserve focus when dragging 2 duplicated rows
    id: getRowUniqueId(),
  };
}

export function editModelToSaveModel(rows: ValueMappingEditRowModel[]) {
  const mappings: ValueMapping[] = [];
  const valueMaps: ValueMapping = {
    type: MappingType.ValueToText,
    options: {},
  };

  rows.forEach((item, index) => {
    const result = {
      ...item.result,
      index,
    };

    // Set empty texts to undefined
    if (!result.text || result.text.trim().length === 0) {
      result.text = undefined;
    }

    switch (item.type) {
      case MappingType.ValueToText:
        if (item.key != null) {
          valueMaps.options[item.key] = result;
        }
        break;
      case MappingType.RangeToText:
        if (item.from != null || item.to != null) {
          mappings.push({
            type: item.type,
            options: {
              from: item.from ?? null,
              to: item.to ?? null,
              result,
            },
          });
        }
        break;
      case MappingType.RegexToText:
        if (item.pattern != null) {
          mappings.push({
            type: item.type,
            options: {
              pattern: item.pattern,
              result,
            },
          });
        }
        break;
      case MappingType.SpecialValue:
        mappings.push({
          type: item.type,
          options: {
            match: item.specialMatch!,
            result,
          },
        });
    }
  });

  if (Object.keys(valueMaps.options).length > 0) {
    mappings.unshift(valueMaps);
  }
  return mappings;
}

export function buildEditRowModels(value: ValueMapping[]) {
  const editRows: ValueMappingEditRowModel[] = [];

  if (value) {
    for (const mapping of value) {
      switch (mapping.type) {
        case MappingType.ValueToText:
          for (const key in mapping.options) {
            editRows.push(
              createRow({
                type: mapping.type,
                result: mapping.options[key],
                key,
              })
            );
          }
          break;
        case MappingType.RangeToText:
          editRows.push(
            createRow({
              type: mapping.type,
              result: mapping.options.result,
              from: mapping.options.from,
              to: mapping.options.to,
            })
          );
          break;
        case MappingType.RegexToText:
          editRows.push(
            createRow({
              type: mapping.type,
              result: mapping.options.result,
              pattern: mapping.options.pattern,
            })
          );
          break;
        case MappingType.SpecialValue:
          editRows.push(
            createRow({
              type: mapping.type,
              result: mapping.options.result,
              specialMatch: mapping.options.match ?? SpecialValueMatch.Null,
            })
          );
      }
    }
  }

  // Sort by index
  editRows.sort((a, b) => {
    return (a.result.index ?? 0) > (b.result.index ?? 0) ? 1 : -1;
  });

  return editRows;
}
