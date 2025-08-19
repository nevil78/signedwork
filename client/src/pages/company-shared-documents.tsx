import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Separator 
} from '@/components/ui/separator';
import {
  ArrowLeft, FileText, User, Briefcase, GraduationCap, 
  Award, Mail, Phone, MapPin, Globe, Github, Linkedin,
  Calendar, Building, MapPin as LocationIcon, 
  Download, ExternalLink, ClipboardList, ChevronDown, ChevronRight,
  CheckCircle, Shield, AlertTriangle, BookOpen
} from 'lucide-react';
import CompanyNavHeader from '@/components/company-nav-header';

interface SharedProfile {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  summary?: string;
  currentPosition?: string;
  currentCompany?: string;
  industry?: string;
  skills: string[];
  languages: string[];
  achievements?: string[];
  website?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  profilePhoto?: string;
  // Basic Details
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

interface SharedExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  achievements: string[];
}

interface SharedEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  category: string;
  startYear: number;
  endYear?: number;
  grade?: string;
  activities?: string;
  description?: string;
}

interface SharedCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

interface WorkEntry {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string[];
  rating?: number;
  feedback?: string;
  createdAt: string;
  companyName?: string;
}

interface SharedDocuments {
  applicationId: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
  };
  coverLetter?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  salaryExpectation?: string;
  sharedProfile?: SharedProfile;
  sharedWorkDiary?: WorkEntry[];
  sharedExperience?: SharedExperience[];
  sharedEducation?: SharedEducation[];
  sharedCertifications?: SharedCertification[];
}

export default function CompanySharedDocumentsPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const { data: sharedDocs, isLoading, error } = useQuery({
    queryKey: ['/api/company/applications', applicationId, 'shared-documents'],
    enabled: !!applicationId,
  });

  const toggleEntry = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CompanyNavHeader />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !sharedDocs) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CompanyNavHeader />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Failed to load shared documents
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The employee's shared documents could not be loaded.
              </p>
              <Button asChild>
                <Link href="/company-recruiter">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const docs = sharedDocs as SharedDocuments;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CompanyNavHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/company-recruiter">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {docs.employee.firstName?.[0]}{docs.employee.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Shared Documents - {docs.employee.firstName} {docs.employee.lastName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{docs.employee.email}</p>
            </div>
          </div>

          {/* Application Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.coverLetter && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Cover Letter</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{docs.coverLetter}</p>
                  </div>
                )}
                {docs.salaryExpectation && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Salary Expectation</h4>
                    <p className="text-gray-600 dark:text-gray-400">{docs.salaryExpectation}</p>
                  </div>
                )}
                {docs.attachmentUrl && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Additional Attachment</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(docs.attachmentUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {docs.attachmentName || 'Download Attachment'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shared Profile Section */}
          {docs.sharedProfile && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile (Shared as CV)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {docs.sharedProfile?.profilePhoto && (
                    <div className="flex justify-center">
                      <img 
                        src={docs.sharedProfile.profilePhoto} 
                        alt="Profile" 
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {docs.sharedProfile?.firstName} {docs.sharedProfile?.lastName}
                    </h3>
                    {docs.sharedProfile?.headline && (
                      <p className="text-gray-600 dark:text-gray-400">{docs.sharedProfile.headline}</p>
                    )}
                  </div>

                  {docs.sharedProfile?.summary && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Summary</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{docs.sharedProfile.summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docs.sharedProfile?.currentPosition && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Current Position</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{docs.sharedProfile.currentPosition}</p>
                      </div>
                    )}
                    {docs.sharedProfile?.currentCompany && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Current Company</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{docs.sharedProfile.currentCompany}</p>
                      </div>
                    )}
                    {docs.sharedProfile?.industry && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Industry</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{docs.sharedProfile.industry}</p>
                      </div>
                    )}
                  </div>

                  {(docs.sharedProfile?.skills?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {docs.sharedProfile?.skills?.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(docs.sharedProfile?.languages?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {docs.sharedProfile?.languages?.map((language, index) => (
                          <Badge key={index} variant="outline">{language}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Basic Details */}
                  {(docs.sharedProfile?.phone || docs.sharedProfile?.dateOfBirth || docs.sharedProfile?.gender) && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Basic Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {docs.sharedProfile?.phone && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Mobile Number</span>
                            <p className="text-gray-900 dark:text-gray-100">{docs.sharedProfile.phone}</p>
                          </div>
                        )}
                        
                        {docs.sharedProfile?.dateOfBirth && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Date of Birth</span>
                            <p className="text-gray-900 dark:text-gray-100">{new Date(docs.sharedProfile.dateOfBirth).toLocaleDateString()}</p>
                          </div>
                        )}
                        
                        {docs.sharedProfile?.gender && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">Gender</span>
                            <p className="text-gray-900 dark:text-gray-100 capitalize">{docs.sharedProfile.gender.replace('_', ' ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex flex-wrap gap-3">
                    {docs.sharedProfile?.website && (
                      <Button variant="outline" size="sm" onClick={() => window.open(docs.sharedProfile?.website, '_blank')}>
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </Button>
                    )}
                    {docs.sharedProfile?.linkedinUrl && (
                      <Button variant="outline" size="sm" onClick={() => window.open(docs.sharedProfile?.linkedinUrl, '_blank')}>
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </Button>
                    )}
                    {docs.sharedProfile?.githubUrl && (
                      <Button variant="outline" size="sm" onClick={() => window.open(docs.sharedProfile?.githubUrl, '_blank')}>
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Experience */}
              {docs.sharedExperience && docs.sharedExperience.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {docs.sharedExperience.map((exp, index) => (
                        <div key={exp.id} className={index > 0 ? "border-t pt-4" : ""}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{exp.title}</h4>
                              <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                              {exp.location && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <LocationIcon className="h-3 w-3" />
                                  {exp.location}
                                </p>
                              )}
                            </div>
                            <Badge variant={exp.isCurrent ? "default" : "secondary"}>
                              {exp.isCurrent ? "Current" : "Past"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {new Date(exp.startDate).toLocaleDateString()} - {
                              exp.isCurrent ? "Present" : 
                              exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"
                            }
                          </p>
                          {exp.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {docs.sharedEducation && docs.sharedEducation.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {docs.sharedEducation.map((edu, index) => (
                        <div key={edu.id} className={index > 0 ? "border-t pt-4" : ""}>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{edu.degree}</h4>
                          <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                          {edu.fieldOfStudy && (
                            <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {edu.startYear} - {edu.endYear || "Present"}
                          </p>
                          {edu.grade && (
                            <p className="text-sm text-gray-500">Grade: {edu.grade}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {docs.sharedCertifications && docs.sharedCertifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {docs.sharedCertifications.map((cert, index) => (
                        <div key={cert.id} className={index > 0 ? "border-t pt-4" : ""}>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{cert.name}</h4>
                          <p className="text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                          {cert.issueDate && (
                            <p className="text-sm text-gray-500">
                              Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            </p>
                          )}
                          {cert.credentialUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(cert.credentialUrl, '_blank')}
                              className="mt-2"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Credential
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Shared Work Diary Section */}
          {docs.sharedWorkDiary && docs.sharedWorkDiary.length > 0 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Work Diary (Shared as Experience)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Group work entries by company
                    const entriesByCompany = docs.sharedWorkDiary.reduce((acc: any, entry: any) => {
                      const companyName = entry.companyName || 'Unknown Company';
                      if (!acc[companyName]) {
                        acc[companyName] = [];
                      }
                      acc[companyName].push(entry);
                      return acc;
                    }, {});

                    return (
                      <div className="space-y-6">
                        {Object.entries(entriesByCompany).map(([companyName, entries]: [string, any]) => (
                          <div key={companyName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {companyName}
                              </h3>
                              <Badge variant="secondary" className="ml-auto">
                                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                              </Badge>
                            </div>
                            
                            <div className="space-y-4">
                              {entries.map((entry: any, index: number) => {
                                const isExpanded = expandedEntries.has(entry.id);
                                return (
                                  <div key={entry.id} className={index > 0 ? "border-t border-gray-100 dark:border-gray-800 pt-4" : ""}>
                                    <div 
                                      className="flex justify-between items-start mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                                      onClick={() => toggleEntry(entry.id)}
                                    >
                                      <div className="flex items-center gap-2 flex-1">
                                        {isExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-gray-500" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-gray-500" />
                                        )}
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{entry.title}</h4>
                                        {entry.approvalStatus === "approved" && (
                                          <div className="flex items-center gap-1 ml-2">
                                            <Shield className="h-4 w-4 text-green-600" />
                                            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-600">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Verified
                                            </Badge>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-2 flex-shrink-0">
                                        <Badge variant="secondary">{entry.priority}</Badge>
                                      </div>
                                    </div>
                                    
                                    {isExpanded && (
                                      <div className="ml-6 mt-3 space-y-4">
                                        {/* Work Entry Details */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Work Description</h5>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">{entry.description}</p>
                                        </div>

                                        {/* Challenges Faced */}
                                        {entry.challenges && (
                                          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                                            <h5 className="font-medium text-orange-900 dark:text-orange-200 mb-2 flex items-center gap-2">
                                              <AlertTriangle className="h-4 w-4" />
                                              Challenges Faced
                                            </h5>
                                            <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">{entry.challenges}</p>
                                          </div>
                                        )}
                                        
                                        {/* Key Learnings */}
                                        {entry.learnings && (
                                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                            <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                                              <BookOpen className="h-4 w-4" />
                                              Key Learnings
                                            </h5>
                                            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">{entry.learnings}</p>
                                          </div>
                                        )}
                                        
                                        {/* Work Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                              <span className="text-gray-500">Created:</span>
                                              <span className="text-gray-700 dark:text-gray-300">{new Date(entry.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Last Updated:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{new Date(entry.updatedAt).toLocaleDateString()}</span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          <div className="space-y-2">
                                            {entry.startDate && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Start Date:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{new Date(entry.startDate).toLocaleDateString()}</span>
                                              </div>
                                            )}
                                            {entry.endDate && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">End Date:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{new Date(entry.endDate).toLocaleDateString()}</span>
                                              </div>
                                            )}
                                            {entry.hoursWorked && (
                                              <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Hours Worked:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{entry.hoursWorked}h</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Tags */}
                                        {entry.tags && entry.tags.length > 0 && (
                                          <div>
                                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills & Technologies</h6>
                                            <div className="flex flex-wrap gap-2">
                                              {entry.tags.map((tag: string, tagIndex: number) => (
                                                <Badge key={tagIndex} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600">
                                                  {tag}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Company Verification & Rating */}
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            <h6 className="font-medium text-green-800 dark:text-green-200">Company Verification</h6>
                                          </div>
                                          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                                            This work entry has been verified and approved by {entry.companyName}.
                                          </p>
                                          {entry.rating && (
                                            <div className="mt-3">
                                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                Company Rating: {entry.rating}/5 stars
                                              </p>
                                              {entry.feedback && (
                                                <div className="mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                                  <p className="text-sm text-green-700 dark:text-green-300 italic">"{entry.feedback}"</p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Attachments */}
                                        {entry.attachments && entry.attachments.length > 0 && (
                                          <div>
                                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</h6>
                                            <div className="space-y-1">
                                              {entry.attachments.map((attachment: string, index: number) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                  <ExternalLink className="h-3 w-3 text-gray-400" />
                                                  <a 
                                                    href={attachment} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                  >
                                                    View attachment {index + 1}
                                                  </a>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* No Shared Documents Message */}
        {!docs.sharedProfile && !docs.sharedWorkDiary && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No shared documents
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This applicant chose not to share their profile or work diary with this application.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}