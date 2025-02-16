type Module = {
  modulename: string;
  description: string[];
};

export const parsePlan = (planXml: string): Module[] => {
  // Create a temporary DOM element to parse the XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(planXml, "text/xml");
  const moduleElements = xmlDoc.getElementsByTagName("module");

  const modules: Module[] = [];

  for (let i = 0; i < moduleElements.length; i++) {
    const moduleElement = moduleElements[i];
    const modulename =
      moduleElement.getElementsByTagName("modulename")[0]?.textContent || "";
    const descriptionLines = moduleElement.getElementsByTagName("line");

    const description: string[] = [];
    for (let j = 0; j < descriptionLines.length; j++) {
      const line = descriptionLines[j].textContent;
      if (line) description.push(line);
    }

    modules.push({
      modulename,
      description,
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
