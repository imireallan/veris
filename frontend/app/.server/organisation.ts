     1|import { api } from '~/.server/api';
     2|import { Organization } from '~/types'; // Assuming Organization type exists
     3|
     4|// Function to get organizations, ensuring it accepts accessToken
     5|export async function getOrganizations(accessToken: string): Promise<Organization[] | null> {
     6|  try {
     7|    const data = await api.get<Organization[]>('/api/organizations/', {
     8|      headers: { Authorization: `Bearer ${accessToken}` }
     9|    });
    10|    return data;
    11|  } catch (error) {
    12|    console.error('Error fetching organizations:', error);
    13|    return null;
    14|  }
    15|}
    16|
    17|// Function to get a single organization by ID
    18|export async function getOrganization(id: string, accessToken: string): Promise<Organization | null> {
    19|  try {
    20|    const data = await api.get<Organization>(`/api/organizations/${id}/`, {
    21|      headers: { Authorization: `Bearer ${accessToken}` }
    22|    });
    23|    return data;
    24|  } catch (error) {
    25|    console.error(`Error fetching organization ${id}:`, error);
    26|    return null;
    27|  }
    28|}
    29|