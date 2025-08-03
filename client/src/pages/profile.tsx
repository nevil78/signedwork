import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Award, Briefcase, GraduationCap, FolderOpen, MessageSquare, User, Calendar, MapPin, Globe, Building, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  type Experience,
  type Education,
  type Certification,
  type Project,
  type Endorsement,
  type Employee
} from "@shared/schema";

type ProfileSection = "overview" | "experience" | "education" | "certifications" | "projects" | "endorsements";

export default function Profile() {
  const [activeSection, setActiveSection] = useState<ProfileSection>("overview");
  
  // Fetch user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/employee/profile", userResponse?.user?.id],
    enabled: !!userResponse?.user?.id && userResponse?.userType === "employee",
  });

  const isLoading = userLoading || profileLoading;
  const user = userResponse?.user as Employee;
  const profile = profileData || { experiences: [], educations: [], certifications: [], projects: [], endorsements: [] };

  const sidebarItems = [
    { id: "overview", label: "Profile Overview", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "endorsements", label: "Endorsements", icon: MessageSquare },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userResponse || userResponse.userType !== "employee") {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-slate-800">Profile</span>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/auth/logout"}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={user?.profilePhoto || undefined} />
                    <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {user?.headline || "Professional"}
                  </p>
                </div>
                
                <nav className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id as ProfileSection)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeSection === item.id
                            ? "bg-primary text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === "overview" && <OverviewSection user={user} />}
            {activeSection === "experience" && <ExperienceSection data={profile.experiences} />}
            {activeSection === "education" && <EducationSection data={profile.educations} />}
            {activeSection === "certifications" && <CertificationsSection data={profile.certifications} />}
            {activeSection === "projects" && <ProjectsSection data={profile.projects} />}
            {activeSection === "endorsements" && <EndorsementsSection data={profile.endorsements} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ user }: { user: Employee | undefined }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Phone:</span> {user?.countryCode} {user?.phone}
                </p>
                {user?.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </p>
                )}
                {user?.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {user.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Professional Details</h3>
              <div className="space-y-2 text-sm">
                {user?.currentPosition && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Position:</span> {user.currentPosition}
                  </p>
                )}
                {user?.currentCompany && (
                  <p className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {user.currentCompany}
                  </p>
                )}
                {user?.industry && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Industry:</span> {user.industry}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {user?.summary && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">About</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{user.summary}</p>
            </div>
          )}
          
          {user?.skills && user.skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Experience Section Component
function ExperienceSection({ data }: { data: Experience[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Experience</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>
      
      <div className="space-y-6">
        {data.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No work experience added yet.</p>
              <p className="text-xs text-slate-500 mt-2">Click "Add Experience" to add your work history.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((experience) => (
            <Card key={experience.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{experience.title}</h3>
                    <p className="text-primary font-medium">{experience.company}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {experience.startDate} - {experience.endDate || "Present"}
                      </span>
                      {experience.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {experience.location}
                        </span>
                      )}
                    </div>
                    {experience.description && (
                      <p className="text-slate-700 mt-3 text-sm leading-relaxed">{experience.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Education Section Component
function EducationSection({ data }: { data: Education[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Education</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>
      
      <div className="space-y-6">
        {data.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No education records added yet.</p>
              <p className="text-xs text-slate-500 mt-2">Click "Add Education" to add your educational background.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((education) => (
            <Card key={education.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{education.degree}</h3>
                    <p className="text-primary font-medium">{education.institution}</p>
                    <p className="text-sm text-slate-600 mt-1">{education.fieldOfStudy}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {education.startYear} - {education.endYear || "Present"}
                      </span>
                      {education.grade && (
                        <span>Grade: {education.grade}</span>
                      )}
                    </div>
                    {education.description && (
                      <p className="text-slate-700 mt-3 text-sm leading-relaxed">{education.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Certifications Section Component
function CertificationsSection({ data }: { data: Certification[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Certifications</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>
      
      <div className="space-y-6">
        {data.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No certifications added yet.</p>
              <p className="text-xs text-slate-500 mt-2">Click "Add Certification" to showcase your professional certifications.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{cert.name}</h3>
                    <p className="text-primary font-medium">{cert.issuingOrganization}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {cert.issueDate} {cert.expirationDate && `- ${cert.expirationDate}`}
                      </span>
                      {cert.credentialId && (
                        <span>ID: {cert.credentialId}</span>
                      )}
                    </div>
                    {cert.credentialUrl && (
                      <a 
                        href={cert.credentialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Credential
                      </a>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Projects Section Component
function ProjectsSection({ data }: { data: Project[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>
      
      <div className="space-y-6">
        {data.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No projects added yet.</p>
              <p className="text-xs text-slate-500 mt-2">Click "Add Project" to showcase your work and accomplishments.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((project) => (
            <Card key={project.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {project.startDate} - {project.endDate || "Ongoing"}
                      </span>
                      {project.teamSize && (
                        <span>Team Size: {project.teamSize}</span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-slate-700 mt-3 text-sm leading-relaxed">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-4 mt-3">
                      {project.projectUrl && (
                        <a 
                          href={project.projectUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Project
                        </a>
                      )}
                      {project.repositoryUrl && (
                        <a 
                          href={project.repositoryUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Repository
                        </a>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Endorsements Section Component
function EndorsementsSection({ data }: { data: Endorsement[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Endorsements</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Endorsement
        </Button>
      </div>
      
      <div className="space-y-6">
        {data.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No endorsements added yet.</p>
              <p className="text-xs text-slate-500 mt-2">Click "Add Endorsement" to add testimonials from colleagues and clients.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((endorsement) => (
            <Card key={endorsement.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{endorsement.endorserName}</h3>
                        <p className="text-sm text-slate-600">
                          {endorsement.endorserPosition} {endorsement.endorserCompany && `at ${endorsement.endorserCompany}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Relationship: {endorsement.relationship}</p>
                        <blockquote className="text-slate-700 mt-3 text-sm leading-relaxed border-l-4 border-primary/20 pl-4 italic">
                          "{endorsement.endorsementText}"
                        </blockquote>
                        <p className="text-xs text-slate-500 mt-2">{endorsement.endorsementDate}</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}