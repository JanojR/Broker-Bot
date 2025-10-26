'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  budgetMax?: number;
  createdAt: string;
  providers: any[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/v1/projects');
      setProjects(res.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Link href="/projects/new" className="btn btn-primary">
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-600 mb-4">No projects yet</p>
            <Link href="/projects/new" className="btn btn-primary">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="card hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <p className="text-gray-600">{project.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 rounded text-sm bg-primary-100 text-primary-700">
                        {project.status}
                      </span>
                      {project.budgetMax && (
                        <p className="mt-2 text-gray-600">${project.budgetMax}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
