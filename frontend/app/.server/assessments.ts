import { api } from "~/.server/lib/api";
     2|import { Assessment } from '~/types'; // Assuming Assessment type exists
     3|
     4|// Function to get assessments for an organization
     5|export async function getAssessments(organizationId: string, accessToken: string): Promise<Assessment[] | null> {
     6|  try {
     7|    const data = await api.get<Assessment[]>(`/api/organizations/${organizationId}/assessments/`, {
     8|      headers: { Authorization: `Bearer ${accessToken}` }
     9|    });
    10|    return data;
    11|  } catch (error) {
    12|    console.error(`Error fetching assessments for org ${organizationId}:`, error);
    13|    return null;
    14|  }
    15|}
    16|
    17|// Function to get a single assessment
    18|export async function getAssessment(organizationId: string, assessmentId: string, accessToken: string): Promise<Assessment | null> {
    19|  try {
    20|    const data = await api.get<Assessment>(`/api/organizations/${organizationId}/assessments/${assessmentId}/`, {
    21|      headers: { Authorization: `Bearer ${accessToken}` }
    22|    });
    23|    return data;
    24|  } catch (error) {
    25|    console.error(`Error fetching assessment ${assessmentId} for org ${organizationId}:`, error);
    26|    return null;
    27|  }
    28|}
    29|