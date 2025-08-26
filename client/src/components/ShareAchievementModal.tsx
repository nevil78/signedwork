import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, Users, LinkedIn, Mail, Twitter } from "lucide-react";
import signedworkLogo from "@assets/signedwork-logo.png";

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    id: string;
    title: string;
    category: string;
    skills: string[];
    verifiedBy: string;
    companyName: string;
    period: string;
    status: string;
  };
}

export default function ShareAchievementModal({ 
  isOpen, 
  onClose, 
  achievement 
}: ShareAchievementModalProps) {
  const { toast } = useToast();
  const [shareSettings, setShareSettings] = useState({
    includeCompany: true,
    includeSkills: true,
    includeVerifier: false,
    customMessage: ""
  });
  const [emailList, setEmailList] = useState("");
  const [activeTab, setActiveTab] = useState<"share" | "invite">("share");

  // Generate privacy-safe achievement card content
  const generateShareContent = () => {
    const sanitizedTitle = achievement.title.replace(/\b(confidential|internal|proprietary|client|customer)\b/gi, '[Project]');
    
    let content = `🎯 Achievement Verified\n\n"${sanitizedTitle}"\n`;
    content += `✓ Manager-verified professional work\n`;
    
    if (shareSettings.includeCompany) {
      content += `📍 ${achievement.companyName}\n`;
    }
    
    if (shareSettings.includeSkills && achievement.skills.length > 0) {
      content += `🔧 Skills: ${achievement.skills.slice(0, 3).join(', ')}\n`;
    }
    
    content += `📅 ${achievement.period}\n\n`;
    content += `Building verified professional credibility on Signedwork\n`;
    content += `#VerifiedProfessional #ProfessionalGrowth`;
    
    if (shareSettings.customMessage) {
      content = `${shareSettings.customMessage}\n\n${content}`;
    }
    
    return content;
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=achievement&utm_source=share&utm_medium=social`;
  };

  const handleCopyLink = () => {
    const shareUrl = generateShareUrl();
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Share link copied to clipboard",
    });
  };

  const handleSocialShare = (platform: string) => {
    const content = generateShareContent();
    const shareUrl = generateShareUrl();
    
    let url = "";
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(content)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent("Check out my verified achievement")}&body=${encodeURIComponent(content + "\n\n" + shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleInviteColleagues = () => {
    const emails = emailList.split(',').map(e => e.trim()).filter(e => e);
    if (emails.length === 0) {
      toast({
        title: "No emails provided",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    // Generate invitation message
    const inviteMessage = `Hi! I've been using Signedwork to get my professional work verified by managers. It's building a credible track record that really stands out in job applications.\n\nThought you might be interested in building verified professional credibility too.\n\nCheck it out: ${generateShareUrl()}\n\nBest regards!`;

    // Create mailto link for bulk invitation
    const mailtoLink = `mailto:${emails.join(',')}?subject=${encodeURIComponent("Join me on Signedwork - Professional Work Verification")}&body=${encodeURIComponent(inviteMessage)}`;
    window.open(mailtoLink);

    toast({
      title: "Invitation Ready!",
      description: `Invitation email opened for ${emails.length} colleague${emails.length > 1 ? 's' : ''}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Achievement & Invite Colleagues
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === "share" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("share")}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Achievement
          </Button>
          <Button
            variant={activeTab === "invite" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("invite")}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Invite Colleagues
          </Button>
        </div>

        {activeTab === "share" && (
          <div className="space-y-6">
            {/* Achievement Preview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Verified Achievement</h3>
                    <p className="text-sm text-gray-600">Professional Work Verification</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✓ Verified
                </Badge>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-gray-900">
                  "{achievement.title.replace(/\b(confidential|internal|proprietary|client|customer)\b/gi, '[Project]')}"
                </h4>
                
                {shareSettings.includeCompany && (
                  <p className="text-gray-700">📍 {achievement.companyName}</p>
                )}
                
                {shareSettings.includeSkills && achievement.skills.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {achievement.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-600">📅 {achievement.period}</p>
                
                <div className="text-sm text-blue-700 font-medium">
                  Building verified professional credibility on Signedwork
                </div>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Privacy Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Include Company Name</p>
                    <p className="text-xs text-gray-500">Show where this achievement was earned</p>
                  </div>
                  <Switch
                    checked={shareSettings.includeCompany}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, includeCompany: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Include Skills</p>
                    <p className="text-xs text-gray-500">Show relevant skills from this achievement</p>
                  </div>
                  <Switch
                    checked={shareSettings.includeSkills}
                    onCheckedChange={(checked) => 
                      setShareSettings(prev => ({ ...prev, includeSkills: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Add Personal Message (Optional)
              </label>
              <Textarea
                placeholder="Add a personal note to your achievement share..."
                value={shareSettings.customMessage}
                onChange={(e) => 
                  setShareSettings(prev => ({ ...prev, customMessage: e.target.value }))
                }
                className="min-h-20"
              />
            </div>

            <Separator />

            {/* Share Options */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Share Options</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleSocialShare("linkedin")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <LinkedIn className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                
                <Button 
                  onClick={() => handleSocialShare("twitter")}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                
                <Button 
                  onClick={() => handleSocialShare("email")}
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "invite" && (
          <div className="space-y-6">
            {/* Invitation Message Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Invitation Preview</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Subject:</strong> Join me on Signedwork - Professional Work Verification
                </p>
                <div className="bg-white p-3 rounded border text-xs">
                  <p>Hi! I've been using Signedwork to get my professional work verified by managers. It's building a credible track record that really stands out in job applications.</p>
                  <br />
                  <p>Thought you might be interested in building verified professional credibility too.</p>
                  <br />
                  <p>Check it out: {generateShareUrl()}</p>
                  <br />
                  <p>Best regards!</p>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Colleague Email Addresses
              </label>
              <Textarea
                placeholder="Enter email addresses separated by commas&#10;example: john@company.com, sarah@company.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-gray-500">
                Separate multiple email addresses with commas
              </p>
            </div>

            {/* Send Invitation */}
            <Button 
              onClick={handleInviteColleagues}
              className="w-full"
              size="lg"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invitations
            </Button>

            {/* Why Invite */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Why invite colleagues?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Build industry networks with verified professionals</li>
                <li>• Access verified talent pool for future opportunities</li>
                <li>• Strengthen professional relationships with credible work history</li>
                <li>• Get recognition for referring quality professionals</li>
              </ul>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}