import { Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { LinkButton } from '@grafana/ui';
import { contextSrv } from 'app/core/core';

import { useDataSource } from '../state/hooks';
import { trackCreateDashboardClicked, trackDsConfigClicked, trackExploreClicked } from '../tracking';
import { constructDataSourceExploreUrl } from '../utils';

interface Props {
  uid: string;
}

export function EditDataSourceActions({ uid }: Props) {
  const dataSource = useDataSource(uid);
  const hasExploreRights = contextSrv.hasAccessToExplore();

  return (
    <>
      {hasExploreRights && (
        <LinkButton
          variant="secondary"
          size="sm"
          href={constructDataSourceExploreUrl(dataSource)}
          onClick={() => {
            trackDsConfigClicked('explore');
            trackExploreClicked({
              grafana_version: config.buildInfo.version,
              datasource_uid: dataSource.uid,
              plugin_name: dataSource.typeName,
              path: window.location.pathname,
            });
          }}
        >
          <Trans i18nKey="datasources.edit-data-source-actions.explore-data">Explore data</Trans>
        </LinkButton>
      )}
      <LinkButton
        size="sm"
        variant="secondary"
        href={`dashboard/new-with-ds/${dataSource.uid}`}
        onClick={() => {
          trackDsConfigClicked('build_a_dashboard');
          trackCreateDashboardClicked({
            grafana_version: config.buildInfo.version,
            datasource_uid: dataSource.uid,
            plugin_name: dataSource.typeName,
            path: window.location.pathname,
          });
        }}
      >
        <Trans i18nKey="datasources.edit-data-source-actions.build-a-dashboard">Build a dashboard</Trans>
      </LinkButton>
    </>
  );
}
