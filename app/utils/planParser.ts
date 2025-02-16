type Module = {
  modulename: string;
  description: string[];
  content?: string;
  practice?: string;
};

export const parsePlan = (planXml: string): Module[] => {
  // Create a temporary DOM element to parse the XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(planXml, "text/xml");

  // Debug log
  console.log("Parsing XML:", planXml);

  const moduleElements = xmlDoc.getElementsByTagName("module");
  console.log("Found modules:", moduleElements.length);

  const modules: Module[] = [];

  for (let i = 0; i < moduleElements.length; i++) {
    const moduleElement = moduleElements[i];

    // Get module name
    const modulename =
      moduleElement.getElementsByTagName("modulename")[0]?.textContent || "";

    // Get description lines
    const descriptionElement =
      moduleElement.getElementsByTagName("description")[0];
    const descriptionLines =
      descriptionElement?.getElementsByTagName("line") || [];

    // Get content and practice
    const contentElement = moduleElement.getElementsByTagName("content")[0];
    const practiceElement = moduleElement.getElementsByTagName("practice")[0];

    const content = contentElement?.textContent?.trim() || "";
    const practice = practiceElement?.textContent?.trim() || "";

    const description: string[] = [];
    for (let j = 0; j < descriptionLines.length; j++) {
      const line = descriptionLines[j].textContent;
      if (line) description.push(line.trim());
    }

    // Debug log for each module
    console.log("Parsed module:", {
      modulename,
      descriptionLength: description.length,
      hasContent: !!content,
      hasPractice: !!practice,
    });

    modules.push({
      modulename,
      description,
      ...(content && { content }),
      ...(practice && { practice }),
    });
  }

  return modules;
};

// Alternative parser for when the content is already structured (not XML)
export const parseStructuredPlan = (content: string): Module[] => {
  try {
    // Split the content into module blocks
    const moduleBlocks = content
      .split(/Module \d+:/g)
      .filter((block) => block.trim());

    return moduleBlocks.map((block) => {
      const lines = block.split("\n").filter((line) => line.trim());
      const modulename = `Module ${
        moduleBlocks.indexOf(block) + 1
      }: ${lines[0].trim()}`;
      const description = lines.slice(1).map((line) => line.trim());

      return {
        modulename,
        description,
      };
    });
  } catch (error) {
    console.error("Error parsing plan:", error);
    return [];
  }
};
