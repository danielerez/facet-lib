import React from 'react';
import { Link } from 'react-router-dom';
import {
  PageSectionVariants,
  TextContent,
  Text,
  ButtonVariant,
  GridItem,
  Grid,
} from '@patternfly/react-core';
import { Cluster, Credentials } from '../../api/types';
import { getClusterCredentials } from '../../api/clusters';
import PageSection from '../ui/PageSection';
import { EventsModalButton } from '../ui/eventsModal';
import HostsTable from '../hosts/HostsTable';
import ClusterToolbar from '../clusters/ClusterToolbar';
import { ToolbarButton, ToolbarSecondaryGroup } from '../ui/Toolbar';
import ClusterBreadcrumbs from '../clusters/ClusterBreadcrumbs';
import ClusterProgress from './ClusterProgress';
import ClusterCredentials from './ClusterCredentials';
import ClusterInstallationError from './ClusterInstallationError';
import { LaunchOpenshiftConsoleButton } from './ConsoleModal';
import KubeconfigDownload from './KubeconfigDownload';
import { DetailList, DetailItem } from '../ui/DetailList';
import FeedbackAlert from './FeedbackAlert';
import ClusterProperties from './ClusterProperties';

type ClusterDetailProps = {
  cluster: Cluster;
  setCancelInstallationModalOpen: (isOpen: boolean) => void;
  setResetClusterModalOpen: (isOpen: boolean) => void;
};

const ClusterDetail: React.FC<ClusterDetailProps> = ({
  cluster,
  setCancelInstallationModalOpen,
  setResetClusterModalOpen,
}) => {
  const [credentials, setCredentials] = React.useState<Credentials>();
  const [credentialsError, setCredentialsError] = React.useState();

  const fetchCredentials = React.useCallback(() => {
    const fetch = async () => {
      setCredentialsError(undefined);
      try {
        const response = await getClusterCredentials(cluster.id);
        setCredentials(response.data);
      } catch (err) {
        setCredentialsError(err);
      }
    };
    fetch();
  }, [cluster.id]);

  React.useEffect(() => {
    if (cluster.status === 'installed') {
      fetchCredentials();
    }
  }, [cluster.status, fetchCredentials]);

  return (
    <>
      <ClusterBreadcrumbs clusterName={cluster.name} />
      <PageSection variant={PageSectionVariants.light} isMain>
        <Grid hasGutter>
          <GridItem>
            <TextContent>
              <Text component="h1">{cluster.name}</Text>
            </TextContent>
          </GridItem>
          <GridItem>
            <DetailList title="Creation Progress">
              <DetailItem title="Creation status" value={<ClusterProgress cluster={cluster} />} />
            </DetailList>
          </GridItem>
          {cluster.status === 'error' && (
            <ClusterInstallationError
              cluster={cluster}
              setResetClusterModalOpen={setResetClusterModalOpen}
            />
          )}
          {cluster.status === 'installed' && (
            <ClusterCredentials
              cluster={cluster}
              credentials={credentials}
              error={!!credentialsError}
              retry={fetchCredentials}
            />
          )}
          <KubeconfigDownload status={cluster.status} clusterId={cluster.id} />
          <FeedbackAlert />
          <GridItem>
            <TextContent>
              <Text component="h2">Bare Metal Inventory</Text>
            </TextContent>
            <HostsTable cluster={cluster} />
          </GridItem>
          <ClusterProperties cluster={cluster} />
        </Grid>
      </PageSection>
      <ClusterToolbar>
        {['installing', 'installing-in-progress'].includes(cluster.status) && (
          <ToolbarButton
            variant={ButtonVariant.danger}
            onClick={() => setCancelInstallationModalOpen(true)}
          >
            Abort Installation
          </ToolbarButton>
        )}
        {cluster.status === 'error' && (
          <ToolbarButton onClick={() => setResetClusterModalOpen(true)}>
            Reset Cluster
          </ToolbarButton>
        )}
        {cluster.status === 'installed' && (
          <LaunchOpenshiftConsoleButton
            isDisabled={!credentials || !!credentialsError}
            cluster={cluster}
            consoleUrl={credentials?.consoleUrl}
          />
        )}
        <ToolbarButton
          variant={ButtonVariant.link}
          component={(props) => <Link to="/clusters" {...props} />}
        >
          Close
        </ToolbarButton>
        <ToolbarSecondaryGroup>
          <EventsModalButton
            entityKind="cluster"
            entityId={cluster.id}
            title="Cluster Events"
            variant={ButtonVariant.link}
            style={{ textAlign: 'right' }}
          >
            View Cluster Events History
          </EventsModalButton>
        </ToolbarSecondaryGroup>
      </ClusterToolbar>
    </>
  );
};

export default ClusterDetail;
