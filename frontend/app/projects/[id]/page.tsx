'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Project {
  id: string;
  title: string;
  status: string;
  providers: any[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/v1/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSourcing = async () => {
    if (!confirm('This will search for contractors. Continue?')) return;
    
    setLoading(true);
    try {
      await axios.post(`http://localhost:3001/api/v1/projects/${id}/sourcing/start`);
      // Fetch updated project data
      await fetchProject();
      alert('Sourcing completed! Found candidates.');
    } catch (error: any) {
      console.error('Failed to start sourcing:', error);
      alert(`Error: ${error.response?.data?.error || 'Failed to start sourcing'}`);
      fetchProject(); // Reload regardless
    } finally {
      setLoading(false);
    }
  };

  const handleStartOutreach = async () => {
    if (!confirm('This will contact demo contractors (8586105361 & 3108949312) for quotes. Continue?')) return;
    
    setLoading(true);
    try {
      // Trigger outreach for ALL providers (will only contact demo ones with SMS)
      let contacted = 0;
      for (const provider of project.providers) {
        try {
          await axios.post(`http://localhost:3001/api/v1/providers/${provider.id}/outreach/init`);
          console.log(`Contacted ${provider.name}`);
          contacted++;
        } catch (err: any) {
          console.error(`Failed to contact ${provider.name}:`, err);
        }
      }
      
      await fetchProject();
      alert(`Contacted ${contacted} contractors! Check your phones (8586105361 & 3108949312).`);
    } catch (error: any) {
      console.error('Outreach error:', error);
      alert('Failed to start outreach');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="text-gray-600 mt-1">Status: {project.status}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleStartSourcing}
              className="btn btn-primary"
            >
              Start Sourcing
            </button>
            {project.status === 'awaiting_approval' && project.providers.length > 0 && (
              <button
                onClick={handleStartOutreach}
                className="btn btn-primary"
              >
                Start Negotiations
              </button>
            )}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Candidates ({project.providers.length})</h2>
          
          {project.providers.length === 0 ? (
            <p className="text-gray-600">No candidates yet. Start sourcing to discover contractors.</p>
          ) : (
            <div className="space-y-4">
              {project.providers.map((provider) => (
                <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{provider.name}</h3>
                      <p className="text-sm text-gray-600">{provider.serviceAreaText}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Score: {Math.round(provider.score * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    {provider.contacts.slice(0, 2).map((contact: any) => (
                      <span
                        key={contact.id}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                      >
                        {contact.kind}: {contact.value.slice(0, 20)}...
                      </span>
                    ))}
                  </div>

                  {provider.quotes.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded">
                      <p className="text-sm font-semibold text-green-800">
                        Quote received: ${provider.quotes[0].totalEstimated}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quotes Comparison */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">Quotes</h3>
            {project.providers.filter(p => p.quotes.length > 0).length === 0 ? (
              <p className="text-gray-600 text-sm">No quotes yet</p>
            ) : (
              <div className="space-y-2">
                {project.providers
                  .filter(p => p.quotes.length > 0)
                  .sort((a, b) => 
                    (a.quotes[0]?.totalEstimated || Infinity) - 
                    (b.quotes[0]?.totalEstimated || Infinity)
                  )
                  .map(provider => (
                    <div key={provider.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{provider.name}</span>
                      <span className="font-semibold text-primary-600">
                        ${provider.quotes[0].totalEstimated}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Threads */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">Conversations</h3>
            <div className="space-y-2">
              {project.providers
                .filter(p => p.threads.length > 0)
                .map(provider => (
                  <div key={provider.id} className="p-2 border border-gray-200 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{provider.name}</span>
                      <span className="text-xs text-gray-600">
                        {provider.threads[0].status}
                      </span>
                    </div>
                  </div>
                ))}
              {project.providers.filter(p => p.threads.length > 0).length === 0 && (
                <p className="text-gray-600 text-sm">No conversations yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
