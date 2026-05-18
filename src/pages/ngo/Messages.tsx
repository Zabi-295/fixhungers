import Messages from "@/components/Messages";

const NGOMessages = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Direct Messages</h1>
        <p className="text-muted-foreground text-sm">
          Coordinate pickup logistics directly with Restaurants and Food Providers.
        </p>
      </div>
      <Messages />
    </div>
  );
};

export default NGOMessages;
