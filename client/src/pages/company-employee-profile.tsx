import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Globe, Github, Linkedin, Twitter, Award, Briefcase, GraduationCap, Trophy } from 'lucide-react';

type Employee = {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  nationality?: string;
  maritalStatus?: string;
  headline?: string;
  summary?: string;
  currentPosition?: string;
  currentCompany?: string;
  industry?: string;
  skills?: string[];
  languages?: string[];
  hobbies?: string[];
  interests?: string[];
  website?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  keyAchievements?: string[];
};

type Experience = {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentJob: boolean;
};

type Education = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

type Certification = {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  description?: string;
};

export default function CompanyEmployeeProfile() {
  const { employeeId } = useParams();
  const [, navigate] = useLocation();

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: [`/api/company/employee/${employeeId}`],
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/company/employee/${employeeId}/profile`],
  });

  if (employeeLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <div className="text-center">Loading employee profile...</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <div className="text-center">
            <p className="text-muted-foreground">Employee not found</p>
            <Button onClick={() => navigate('/company-dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const experiences = (profileData as any)?.experiences || [];
  const educations = (profileData as any)?.educations || [];
  const certifications = (profileData as any)?.certifications || [];
  
  // Cast employee to the proper type for safe access
  const employeeData = employee as Employee;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/company-dashboard')}
            className="mb-4"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Employee Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {employeeData.profilePhoto ? (
                  <img
                    src={employeeData.profilePhoto}
                    alt={`${employeeData.firstName} ${employeeData.lastName}`}
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    data-testid="employee-profile-photo"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" data-testid="employee-name">
                  {employeeData.firstName} {employeeData.lastName}
                </h1>
                <p className="text-muted-foreground mb-2" data-testid="employee-id">
                  Employee ID: {employeeData.employeeId}
                </p>
                
                {employeeData.headline && (
                  <p className="text-lg font-medium text-primary mb-2" data-testid="employee-headline">
                    {employeeData.headline}
                  </p>
                )}

                {employeeData.currentPosition && (
                  <p className="text-muted-foreground mb-2" data-testid="employee-position">
                    {employeeData.currentPosition} {employeeData.currentCompany && `at ${employeeData.currentCompany}`}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span data-testid="employee-email">{employeeData.email}</span>
                  </div>
                  {employeeData.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span data-testid="employee-phone">{employeeData.phone}</span>
                    </div>
                  )}
                  {employeeData.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span data-testid="employee-address">{employeeData.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {employeeData.summary && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground" data-testid="employee-summary">
                  {employeeData.summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {experiences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No experience information available
                  </p>
                ) : (
                  <div className="space-y-6">
                    {experiences.map((exp: Experience, index: number) => (
                      <div key={exp.id} className="relative">
                        {index > 0 && <Separator className="mb-6" />}
                        <div className="space-y-2">
                          <h4 className="font-semibold" data-testid={`experience-title-${index}`}>
                            {exp.jobTitle}
                          </h4>
                          <p className="text-primary font-medium" data-testid={`experience-company-${index}`}>
                            {exp.company}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`experience-dates-${index}`}>
                              {exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-muted-foreground mt-2" data-testid={`experience-description-${index}`}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Education Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                {educations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No education information available
                  </p>
                ) : (
                  <div className="space-y-6">
                    {educations.map((edu: Education, index: number) => (
                      <div key={edu.id} className="relative">
                        {index > 0 && <Separator className="mb-6" />}
                        <div className="space-y-2">
                          <h4 className="font-semibold" data-testid={`education-degree-${index}`}>
                            {edu.degree}
                          </h4>
                          <p className="text-primary font-medium" data-testid={`education-institution-${index}`}>
                            {edu.institution}
                          </p>
                          {edu.fieldOfStudy && (
                            <p className="text-muted-foreground" data-testid={`education-field-${index}`}>
                              {edu.fieldOfStudy}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`education-dates-${index}`}>
                              {edu.startDate} - {edu.endDate || 'Present'}
                            </span>
                          </div>
                          {edu.description && (
                            <p className="text-muted-foreground mt-2" data-testid={`education-description-${index}`}>
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No certifications available
                  </p>
                ) : (
                  <div className="space-y-6">
                    {certifications.map((cert: Certification, index: number) => (
                      <div key={cert.id} className="relative">
                        {index > 0 && <Separator className="mb-6" />}
                        <div className="space-y-2">
                          <h4 className="font-semibold" data-testid={`certification-name-${index}`}>
                            {cert.name}
                          </h4>
                          <p className="text-primary font-medium" data-testid={`certification-organization-${index}`}>
                            {cert.issuingOrganization}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`certification-dates-${index}`}>
                              Issued {cert.issueDate}
                              {cert.expirationDate && ` - Expires ${cert.expirationDate}`}
                            </span>
                          </div>
                          {cert.credentialId && (
                            <p className="text-sm text-muted-foreground" data-testid={`certification-id-${index}`}>
                              Credential ID: {cert.credentialId}
                            </p>
                          )}
                          {cert.description && (
                            <p className="text-muted-foreground mt-2" data-testid={`certification-description-${index}`}>
                              {cert.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employeeData.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p data-testid="employee-dob">{employeeData.dateOfBirth}</p>
                  </div>
                )}
                {employeeData.nationality && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                    <p data-testid="employee-nationality">{employeeData.nationality}</p>
                  </div>
                )}
                {employeeData.maritalStatus && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                    <p data-testid="employee-marital-status">{employeeData.maritalStatus}</p>
                  </div>
                )}
                {employeeData.industry && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <p data-testid="employee-industry">{employeeData.industry}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            {employeeData.skills && employeeData.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {employeeData.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" data-testid={`skill-${index}`}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {employeeData.languages && employeeData.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {employeeData.languages.map((language: string, index: number) => (
                      <Badge key={index} variant="outline" data-testid={`language-${index}`}>
                        {language}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Online Presence */}
            <Card>
              <CardHeader>
                <CardTitle>Online Presence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employeeData.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={employeeData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                      data-testid="employee-website"
                    >
                      Website
                    </a>
                  </div>
                )}
                {employeeData.portfolio && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={employeeData.portfolio} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                      data-testid="employee-portfolio"
                    >
                      Portfolio
                    </a>
                  </div>
                )}
                {employeeData.github && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={employeeData.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                      data-testid="employee-github"
                    >
                      GitHub
                    </a>
                  </div>
                )}
                {employeeData.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={employeeData.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                      data-testid="employee-linkedin"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                {employeeData.twitter && (
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={employeeData.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                      data-testid="employee-twitter"
                    >
                      Twitter
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Achievements */}
            {employeeData.keyAchievements && employeeData.keyAchievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Key Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {employeeData.keyAchievements.map((achievement: string, index: number) => (
                      <li key={index} className="text-sm" data-testid={`achievement-${index}`}>
                        • {achievement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Hobbies & Interests */}
            {((employeeData.hobbies && employeeData.hobbies.length > 0) || (employeeData.interests && employeeData.interests.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Hobbies & Interests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employeeData.hobbies && employeeData.hobbies.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Hobbies</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {employeeData.hobbies.map((hobby: string, index: number) => (
                          <Badge key={index} variant="outline" data-testid={`hobby-${index}`}>
                            {hobby}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {employeeData.interests && employeeData.interests.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Interests</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {employeeData.interests.map((interest: string, index: number) => (
                          <Badge key={index} variant="outline" data-testid={`interest-${index}`}>
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}